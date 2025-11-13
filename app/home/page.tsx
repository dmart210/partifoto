"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Album { id: string; name: string; created_at: number; thumbnail?: string; }
interface ActivityItem {
  id: string;
  type: 'photo' | 'comment';
  album_name: string;
  album_id: string;
  uploaded_by?: string;
  created_at: number;
  filename?: string;
  photo_url?: string;
  comment_text?: string;
}
interface UserPhoto {
  id: string;
  filename: string;
  photo_url: string;
  album_name: string;
  album_id: string;
  created_at: number;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setUserEmail(user.email ?? null);

      const [{ data: profData }, partRes] = await Promise.all([
        supabase.from('profiles').select('*').single(),
        supabase.from('album_participation').select('*').order('last_interacted_at', { ascending: false })
      ]);

      if (profData?.username) setUsername(profData.username as string);
      const participation = partRes.data || [];

      if (participation.length) {
        const albumIds = participation.map((p: any) => p.album_id);
        const { data: albumRows } = await supabase.from('albums').select('*').in('id', albumIds);
        
        const albumsWithThumbnails = await Promise.all(
          (albumRows || []).map(async (album: any) => {
            const { data: photos } = await supabase
              .from('photos')
              .select('filename')
              .eq('album_id', album.id)
              .order('created_at', { ascending: false })
              .limit(1);
            
            let thumbnail = null;
            if (photos && photos.length > 0) {
              const { data } = supabase.storage.from('uploads').getPublicUrl(photos[0].filename);
              thumbnail = data.publicUrl;
            }
            
            return { ...album, thumbnail };
          })
        );
        
        setAlbums(albumsWithThumbnails as Album[]);
        
        // Fetch recent activity (photos) from user's albums
        const { data: recentPhotos } = await supabase
          .from('photos')
          .select('id, filename, uploaded_by, created_at, album_id')
          .in('album_id', albumIds)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (recentPhotos && recentPhotos.length > 0) {
          const activityItems: ActivityItem[] = recentPhotos.map((photo: any) => {
            const album = albumsWithThumbnails.find((a: any) => a.id === photo.album_id);
            const { data } = supabase.storage.from('uploads').getPublicUrl(photo.filename);
            
            return {
              id: photo.id,
              type: 'photo' as const,
              album_name: album?.name || 'Unknown Album',
              album_id: photo.album_id,
              uploaded_by: photo.uploaded_by,
              created_at: photo.created_at,
              filename: photo.filename,
              photo_url: data.publicUrl
            };
          });
          
          setRecentActivity(activityItems);
        }
        
        // Fetch photos uploaded by the current user across all albums
        // Try multiple methods: user_id first, then username, then email
        let myPhotos = null;
        
        // Method 1: Try by user_id (most reliable)
        const { data: photosByUserId } = await supabase
          .from('photos')
          .select('id, filename, created_at, album_id, uploaded_by, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (photosByUserId && photosByUserId.length > 0) {
          myPhotos = photosByUserId;
        } else {
          // Method 2: Try by username if it exists
          const currentUsername = profData?.username || username;
          if (currentUsername) {
            const { data: photosByUsername } = await supabase
              .from('photos')
              .select('id, filename, created_at, album_id, uploaded_by, user_id')
              .eq('uploaded_by', currentUsername)
              .order('created_at', { ascending: false })
              .limit(20);
            
            myPhotos = photosByUsername;
          }
        }
        
        if (myPhotos && myPhotos.length > 0) {
            // Get album names for the photos
            const photoAlbumIds = [...new Set(myPhotos.map((p: any) => p.album_id))];
            const { data: photoAlbums } = await supabase
              .from('albums')
              .select('id, name')
              .in('id', photoAlbumIds);
            
            const photoItems: UserPhoto[] = myPhotos.map((photo: any) => {
              const album = photoAlbums?.find((a: any) => a.id === photo.album_id);
              const { data } = supabase.storage.from('uploads').getPublicUrl(photo.filename);
              
              return {
                id: photo.id,
                filename: photo.filename,
                photo_url: data.publicUrl,
                album_name: album?.name || 'Unknown Album',
                album_id: photo.album_id,
                created_at: photo.created_at
              };
            });
            
            setUserPhotos(photoItems);
          }
      }
      setLoading(false);
    })();
  }, [router]);

  // Slideshow timer
  useEffect(() => {
    if (userPhotos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % userPhotos.length);
    }, 4000); // Change photo every 4 seconds
    
    return () => clearInterval(interval);
  }, [userPhotos.length]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-2xl shadow-2xl p-8 border border-subtle">
          <div className="text-muted">Loading</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          <div className="space-y-6">
            <div className="glass-strong rounded-2xl shadow-2xl border border-subtle overflow-hidden">
              <div className="flex items-center justify-between px-8 pt-8 pb-6">
                <h2 className="text-2xl font-bold">Your Account</h2>
                <button onClick={logout} className="glass px-3 py-2 rounded-xl border border-subtle text-sm hover:bg-white/5 transition-all">Sign out</button>
              </div>
              <div className="px-8 pb-8 space-y-4">
                <div className="glass rounded-xl p-4 border border-subtle">
                  <div className="text-sm text-muted">Signed in as</div>
                  <div className="font-bold break-all">{username || userEmail}</div>
                </div>
                <Link href="/account" className="inline-block text-sm text-violet-300 hover:underline">Edit profile</Link>
              </div>
            </div>

            <div className="glass-strong rounded-2xl shadow-2xl border border-subtle overflow-hidden">
              <div className="flex items-center justify-between px-8 pt-8 pb-6">
                <h3 className="text-xl font-bold">Recent Albums</h3>
                <Link className="text-sm text-violet-300 hover:underline" href="/my">View all</Link>
              </div>
              <div className="px-8 pb-8">
                {albums.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-subtle rounded-xl bg-linear-to-br from-violet-950/20 to-fuchsia-900/20">
                    <div className="text-5xl mb-4"></div>
                    <p className="text-muted mb-2">No recent albums yet</p>
                    <p className="text-sm text-muted">Create or visit an album to get started</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {albums.slice(0, 6).map((a) => (
                      <Link key={a.id} href={`/album/${a.id}`} className="group glass rounded-xl overflow-hidden border border-subtle hover:shadow-lg hover:border-violet-500/30 transition-all">
                        {a.thumbnail ? (
                          <div className="relative w-full aspect-video">
                            <Image
                              src={a.thumbnail}
                              alt={a.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="font-semibold text-white group-hover:text-violet-300">{a.name}</div>
                              <div className="text-xs text-white/80">Created {new Date(a.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            <div className="font-semibold group-hover:text-violet-300">{a.name}</div>
                            <div className="text-xs text-muted">Created {new Date(a.created_at).toLocaleDateString()}</div>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Feed - Full Width */}
            <div className="glass-strong rounded-2xl shadow-2xl border border-subtle overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <h3 className="text-xl font-bold">Recent Activity</h3>
              </div>
              <div className="px-8 pb-8">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-subtle rounded-xl bg-linear-to-br from-violet-950/20 to-fuchsia-900/20">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-muted text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {recentActivity.slice(0, 8).map((item) => (
                      <Link
                        key={item.id}
                        href={`/album/${item.album_id}`}
                        className="group flex items-center gap-4 p-3 glass rounded-xl border border-subtle hover:border-violet-500/30 hover:shadow-lg transition-all"
                      >
                        {item.photo_url && (
                          <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={item.photo_url}
                              alt="Activity"
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-violet-400">📸</span>
                            <span className="text-sm font-medium truncate">{item.uploaded_by || 'Someone'}</span>
                          </div>
                          <div className="text-xs text-muted truncate">{item.album_name}</div>
                          <div className="text-xs text-muted/70 mt-1">
                            {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="glass-strong rounded-2xl shadow-xl p-8 border border-subtle">
              <h2 className="text-2xl font-bold mb-6">Next Step</h2>
              <div className="space-y-4">
                <Link
                  href="/create-album"
                  className="group block w-full accent hover:brightness-110 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 text-center shadow-lg hover:shadow-violet-700/40 hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">✨</span>
                    <span>Create New Album</span>
                    <span className="text-xl">✨</span>
                  </span>
                </Link>

                <div className="relative flex items-center justify-center py-4">
                  <div className="border-t border-subtle grow"></div>
                  <span className="px-4 text-muted font-medium">or</span>
                  <div className="border-t border-subtle grow"></div>
                </div>

                <div className="border border-dashed border-subtle rounded-xl p-6 text-center bg-linear-to-br from-violet-950/40 to-fuchsia-900/30 hover:from-violet-900/50 hover:to-fuchsia-800/40 transition-all">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center">
                      <span className="text-2xl">🔗</span>
                    </div>
                  </div>
                  <p className="mb-2 font-semibold">Have a link?</p>
                  <p className="text-sm text-muted mb-3">Paste it in your browser to access the album</p>
                  <code className="text-xs text-violet-300 bg-violet-900/40 px-3 py-1 rounded-full inline-block break-all">
                    /album/abc123xyz
                  </code>
                </div>
              </div>
            </div>

            {/* My Photos Slideshow */}
            <div className="glass-strong rounded-2xl shadow-xl p-8 border border-subtle">
              <h2 className="text-2xl font-bold mb-6">My Photos</h2>
              <div>
                {userPhotos.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-subtle rounded-xl bg-linear-to-br from-violet-950/20 to-fuchsia-900/20">
                    <div className="text-4xl mb-3">🖼️</div>
                    <p className="text-muted text-sm">No photos uploaded yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Slideshow */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                      <Image
                        src={userPhotos[currentPhotoIndex].photo_url}
                        alt={`Photo from ${userPhotos[currentPhotoIndex].album_name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                        priority={currentPhotoIndex === 0}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Photo info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <Link 
                          href={`/album/${userPhotos[currentPhotoIndex].album_id}`}
                          className="text-white font-semibold hover:text-violet-300 transition-colors text-sm"
                        >
                          {userPhotos[currentPhotoIndex].album_name}
                        </Link>
                        <div className="text-xs text-white/80 mt-1">
                          {new Date(userPhotos[currentPhotoIndex].created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Navigation arrows */}
                      {userPhotos.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + userPhotos.length) % userPhotos.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 glass p-2 rounded-full border border-subtle hover:bg-white/10 transition-all"
                            aria-label="Previous photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % userPhotos.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 glass p-2 rounded-full border border-subtle hover:bg-white/10 transition-all"
                            aria-label="Next photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Slideshow indicators */}
                    {userPhotos.length > 1 && (
                      <div className="flex justify-center gap-2 mt-3">
                        {userPhotos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentPhotoIndex
                                ? 'bg-violet-400 w-6'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                            aria-label={`Go to photo ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Photo count */}
                    <div className="text-center mt-3 text-xs text-muted">
                      {currentPhotoIndex + 1} of {userPhotos.length} photo{userPhotos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
