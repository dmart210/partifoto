import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
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
    const authorName = limitAndSanitizeName(body.authorName);
    const content = limitAndSanitizeComment(body.content);
    if (!authorName || !content) {
      return NextResponse.json({ error: 'Author name and content are required' }, { status: 400 });
    }

    const id = nanoid(10);
    const created_at = Date.now();

    const { data: inserted, error } = await supabase
      .from('comments')
      .insert({ id, photo_id: photoId, author_name: authorName, content, created_at })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert comment error:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    const res = NextResponse.json(inserted);
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
    console.error('Error creating comment:', error);
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
      console.error('Supabase select comments error:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    const res = NextResponse.json(data || []);
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

function hardenHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
}
