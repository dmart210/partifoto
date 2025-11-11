import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  validateId,
  enforceRateLimit,
  extractClientKey,
  isAllowedImageMime,
  MAX_FILE_SIZE_BYTES,
  safeFileExtension,
  limitAndSanitizeName,
  limitAndSanitizeTitle
} from '@/lib/security';

// Upload a photo to Supabase Storage and record in DB
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
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
    const { albumId } = await params;
    if (!validateId(albumId)) {
      return NextResponse.json({ error: 'Invalid album id' }, { status: 400 });
    }

    const clientKey = extractClientKey(request.headers);
    if (!enforceRateLimit(clientKey, { capacity: 40, refillPerSec: 1 })) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Ensure album exists
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .single();
    if (albumError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
  // console.error('Error reading multipart form data:', e); // debug disabled for deployment
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }

  const file = (formData.get('file') || formData.get('photo')) as File | null;
  const title = limitAndSanitizeTitle(formData.get('title'));

    if (!file) {
      return NextResponse.json({ error: 'No file provided', hint: 'Expected form field named "file" or "photo"' }, { status: 400 });
    }

    // Fetch the user's username from their profile
    let uploadedBy: string | null = null;
    try {
      const { data: prof } = await authed
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      uploadedBy = prof?.username || null;
    } catch (e) {
      // If profile lookup fails, continue without username
    }

    if ((file as any).size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large', maxBytes: MAX_FILE_SIZE_BYTES }, { status: 413 });
    }

    const rawType = (file as any).type as string | undefined;
    if (!isAllowedImageMime(rawType)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 });
    }

    const photoId = nanoid(10);
    const created_at = Date.now();
    const originalName = file.name;
    const extRaw = safeFileExtension(originalName);
    const ext = extRaw ? `.${extRaw}` : '';
    const storagePath = `${albumId}/${photoId}${ext}`;
    const contentType = rawType || 'application/octet-stream';

  // console.log('Uploading to Supabase storage', { albumId, photoId, storagePath, size: (file as any).size, contentType }); // debug disabled for deployment

    // Upload to public bucket 'uploads'
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, file, { contentType, upsert: false });

    if (uploadError) {
  // console.error('Supabase storage upload error:', uploadError); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to upload file', details: uploadError.message }, { status: 500 });
    }

    // Insert DB row
    const { data: inserted, error: insertError } = await supabase
      .from('photos')
      .insert({
        id: photoId,
        album_id: albumId,
        filename: storagePath,
        original_name: originalName,
        uploaded_by: uploadedBy,
        user_id: user.id, // Store user ID for secure RLS
        title,
        created_at
      })
      .select()
      .single();

    if (insertError) {
  // console.error('Supabase insert photo error:', insertError); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to save photo metadata', details: insertError.message }, { status: 500 });
    }

    const publicUrl = supabase.storage.from('uploads').getPublicUrl(storagePath).data.publicUrl;

    const res = NextResponse.json({ ...inserted, url: publicUrl });
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
  // console.error('Error uploading photo:', error); // debug disabled for deployment
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

// List photos for an album (newest first) with public URLs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;
    if (!validateId(albumId)) {
      return NextResponse.json({ error: 'Invalid album id' }, { status: 400 });
    }

    const clientKey = extractClientKey(request.headers);
    if (!enforceRateLimit(clientKey, { capacity: 120, refillPerSec: 3 })) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) {
  // console.error('Supabase photos list error:', error); // debug disabled for deployment
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    const mapped = (photos || []).map(p => ({
      ...p,
      url: p.filename.includes('/')
        ? supabase.storage.from('uploads').getPublicUrl(p.filename).data.publicUrl
        : `/uploads/${p.filename}` // legacy local files fallback
    }));

    const res = NextResponse.json(mapped);
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
  // console.error('Error fetching photos:', error); // debug disabled for deployment
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

function hardenHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
}
