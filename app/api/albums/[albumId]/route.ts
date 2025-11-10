import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateId, enforceRateLimit, extractClientKey } from '@/lib/security';

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
    if (!enforceRateLimit(clientKey, { capacity: 60, refillPerSec: 2 })) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Fetch album
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('*')
      .eq('id', albumId)
      .single();

    if (albumError) {
      if (albumError.code === 'PGRST116') { // not found
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }
      console.error('Supabase album fetch error:', albumError);
      return NextResponse.json({ error: 'Failed to fetch album' }, { status: 500 });
    }

    // Fetch photos for album
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error('Supabase photos fetch error:', photosError);
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    // Attach public URLs for each photo (assuming public bucket "uploads")
    const photosWithUrl = (photos || []).map(p => ({
      ...p,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/,'')}/storage/v1/object/public/uploads/${p.filename}`
    }));

    const res = NextResponse.json({ ...album, photos: photosWithUrl });
    hardenHeaders(res.headers);
    return res;
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json({ error: 'Failed to fetch album' }, { status: 500 });
  }
}

function hardenHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
}
