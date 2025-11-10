import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  enforceRateLimit,
  extractClientKey,
  limitAndSanitizeAlbumName
} from '@/lib/security';

// Create a new album
export async function POST(request: NextRequest) {
  try {
    // Require authenticated user via Bearer token
    const authz = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authz || !authz.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authz.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authed = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: userErr } = await authed.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Basic rate limit
    const clientKey = extractClientKey(request.headers);
    if (!enforceRateLimit(clientKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const rawName = body?.name;
    const name = limitAndSanitizeAlbumName(rawName);
    if (!name) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 });
    }

    const id = nanoid(10);
    const created_at = Date.now();

    const { error, data } = await supabase
      .from('albums')
      .insert({ id, name: name.trim(), created_at })
      .select()
      .single();

    const res = NextResponse.json(data);
    hardenHeaders(res.headers);
    if (error) {
      // console.error('Supabase insert error (album):', error); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
    }

    return res;
  } catch (error) {
    // console.error('Error creating album:', error); // debug disabled for deployment
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}

// List albums (newest first)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // console.error('Supabase select error (albums list):', error); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
    }

    const res = NextResponse.json(data || []);
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
    // console.error('Error fetching albums:', error); // debug disabled for deployment
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

function hardenHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
}
