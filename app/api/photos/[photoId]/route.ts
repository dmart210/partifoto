import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;

    // Get authenticated user
    const authz = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authz || !authz.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authz.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the photo to check ownership
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('uploaded_by, filename, album_id')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check if user is the owner (uploaded_by is the user's profile username)
    // We need to get the user's profile to match
    const { data: profile } = await authedClient
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const userUsername = profile?.username || null;
    
    console.log('[Delete Photo] Photo uploaded_by:', photo.uploaded_by);
    console.log('[Delete Photo] User username:', userUsername);
    console.log('[Delete Photo] Match?', photo.uploaded_by === userUsername);
    
    // Check if this user uploaded the photo
    if (photo.uploaded_by !== userUsername) {
      return NextResponse.json({ error: 'You can only delete photos you uploaded' }, { status: 403 });
    }

    console.log('[Delete Photo] Ownership check passed, attempting delete...');

    // Delete the photo from storage (if using Supabase storage)
    if (photo.filename) {
      try {
        console.log('[Delete Photo] Deleting from storage:', photo.filename);
        await supabase.storage.from('uploads').remove([photo.filename]);
        console.log('[Delete Photo] Storage deletion successful');
      } catch (storageError) {
        // Log but don't fail - the database record is more important
        console.error('[Delete Photo] Failed to delete from storage:', storageError);
      }
    }

    // Delete the photo record (this will cascade delete comments due to foreign key)
    console.log('[Delete Photo] Deleting from database, photoId:', photoId);
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    console.log('[Delete Photo] Delete result - error:', deleteError);

    if (deleteError) {
      console.error('[Delete Photo] Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete photo', details: deleteError.message }, { status: 500 });
    }

    console.log('[Delete Photo] Delete successful!');
    return NextResponse.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
