import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  validateId,
  enforceRateLimit,
  extractClientKey,
  limitAndSanitizeName,
  limitAndSanitizeComment
} from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    if (!validateId(photoId)) {
      return NextResponse.json({ error: 'Invalid photo id' }, { status: 400 });
    }

    const clientKey = extractClientKey(request.headers);
    if (!enforceRateLimit(clientKey, { capacity: 50, refillPerSec: 1 })) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Ensure photo exists
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id')
      .eq('id', photoId)
      .single();
    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const content = limitAndSanitizeComment(body.content);
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Try to resolve author from authenticated user if a Bearer token is present
    const authz = request.headers.get('authorization') || request.headers.get('Authorization');
    let resolvedAuthor: string | null = null;
    if (authz && authz.toLowerCase().startsWith('bearer ')) {
      const token = authz.split(' ')[1];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      try {
        const authed = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
        const { data: { user } } = await authed.auth.getUser();
        if (user) {
          const { data: prof } = await authed
            .from('profiles')
            .select('display_name, username')
            .eq('id', user.id)
            .single();
          resolvedAuthor = limitAndSanitizeName(prof?.display_name) || limitAndSanitizeName(prof?.username) || null;
        }
      } catch {
        // fall back to client-provided author below
      }
    }

    // Fallback to client-provided author name for unauthenticated users
    if (!resolvedAuthor) {
      resolvedAuthor = limitAndSanitizeName(body.authorName);
    }
    if (!resolvedAuthor) {
      return NextResponse.json({ error: 'Author name is required' }, { status: 400 });
    }

    const id = nanoid(10);
    const created_at = Date.now();

    const { data: inserted, error } = await supabase
      .from('comments')
      .insert({ id, photo_id: photoId, author_name: resolvedAuthor, content, created_at })
      .select()
      .single();

    if (error) {
      // console.error('Supabase insert comment error:', error); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    const res = NextResponse.json(inserted);
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
    // console.error('Error creating comment:', error); // debug disabled for deployment
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    if (!validateId(photoId)) {
      return NextResponse.json({ error: 'Invalid photo id' }, { status: 400 });
    }

    const clientKey = extractClientKey(request.headers);
    if (!enforceRateLimit(clientKey, { capacity: 120, refillPerSec: 3 })) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (error) {
      // console.error('Supabase select comments error:', error); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    const res = NextResponse.json(data || []);
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
    // console.error('Error fetching comments:', error); // debug disabled for deployment
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

function hardenHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
}
