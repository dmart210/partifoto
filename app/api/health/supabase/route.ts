import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// /api/health/supabase
// Returns lightweight health info about DB tables and storage bucket.
// Add ?verbose=1 for extra sample data.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const verbose = url.searchParams.get('verbose') === '1';
  const started = Date.now();

  try {
    // Parallel counts
    const [albumsCount, photosCount, commentsCount] = await Promise.all([
      countTable('albums'),
      countTable('photos'),
      countTable('comments')
    ]);

    // Bucket metadata
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('uploads');
    // List one object just to ensure listing works (ignore error if empty bucket)
    const { data: objects, error: listError } = await supabase.storage.from('uploads').list('', { limit: 1 });

    let sampleRows: Record<string, unknown> | undefined;
    if (verbose) {
      const [latestAlbum, latestPhoto, latestComment] = await Promise.all([
        selectLatest('albums'),
        selectLatest('photos'),
        selectLatest('comments')
      ]);
      sampleRows = { latestAlbum, latestPhoto, latestComment };
    }

    return NextResponse.json({
      ok: true,
      latency_ms: Date.now() - started,
      db: {
        albums: albumsCount,
        photos: photosCount,
        comments: commentsCount
      },
      storage: {
        bucketExists: !!bucket && !bucketError,
        public: bucket?.public ?? false,
        listError: listError?.message || null,
        sampleObject: objects?.[0] || null
      },
      ...(sampleRows ? { samples: sampleRows } : {})
    });
  } catch (error) {
    // console.error('Health endpoint error:', error); // debug disabled for deployment
    return NextResponse.json({ ok: false, error: 'Health check failed' }, { status: 500 });
  }
}

async function countTable(table: string): Promise<number | null> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    // console.error(`Count error for ${table}:`, error.message); // debug disabled for deployment
    return null;
  }
  return count ?? 0;
}

async function selectLatest(table: string) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1);
  if (error) return { error: error.message };
  return data?.[0] || null;
}
