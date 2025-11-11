'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Album, Photo, Comment } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toDataURL as qrToDataURL } from 'qrcode';

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.albumId as string;
  const pathname = usePathname();

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userName, setUserName] = useState('');
  const [profileLoadedName, setProfileLoadedName] = useState<string>('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showQrInline, setShowQrInline] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrAreaRef = useRef<HTMLDivElement | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  // Fetch auth state early so we can gate uploads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthed(!!user);
      } catch (e) {
        // console.warn('Auth check failed', e); // debug disabled for deployment
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchAlbum();
    fetchPhotos();
    loadProfileDisplayName();
  }, [albumId]);
  const loadProfileDisplayName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();
      // Use username for consistency with photo uploads
      const resolved = prof?.username || prof?.display_name || (user.email ? user.email.split('@')[0] : '');
      if (resolved) {
        setProfileLoadedName(resolved);
        setUserName(resolved); // populate for legacy state usage
      }
    } catch (e) {
      // console.warn('Failed to load profile for display name', e); // debug disabled for deployment
    }
  };

  useEffect(() => {
    if (selectedPhoto) {
      fetchComments(selectedPhoto.id);
    }
  }, [selectedPhoto]);

  const recordParticipation = async (albumId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // not logged in: skip
      await supabase.from('album_participation').upsert({
        user_id: user.id,
        album_id: albumId,
        last_interacted_at: Date.now()
      });
    } catch (e) {
      // Silent failure; participation is best-effort
      // console.warn('Participation upsert failed', e); // debug disabled for deployment
    }
  };

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      if (response.ok) {
        const data = await response.json();
        setAlbum(data);
        recordParticipation(albumId);
      }
    } catch (error) {
      // console.error('Error fetching album:', error); // debug disabled for deployment
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        recordParticipation(albumId);
      }
    } catch (error) {
      // console.error('Error fetching photos:', error); // debug disabled for deployment
    }
  };

  const fetchComments = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        // Record participation when viewing comments as an interaction
        recordParticipation(albumId);
      }
    } catch (error) {
      // console.error('Error fetching comments:', error); // debug disabled for deployment
    }
  };

  // Upload logic moved to dedicated upload page

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const response = await fetch(`/api/photos/${selectedPhoto.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          authorName: profileLoadedName || userName || 'Anonymous',
          content: commentText,
        }),
      });

      if (response.ok) {
        setCommentText('');
        fetchComments(selectedPhoto.id);
        // Best-effort: mark participation on successful comment
        recordParticipation(albumId);
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      // console.error('Error adding comment:', error); // debug disabled for deployment
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDownload = (photo: Photo) => {
    // Prefer supabase public URL if available; fallback to legacy local uploads path
    const href = photo.url || (photo.filename.includes('/')
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'')}/storage/v1/object/public/uploads/${photo.filename}`
      : `/uploads/${photo.filename}`);
    const link = document.createElement('a');
    link.href = href;
    link.download = photo.original_name;
    link.click();
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be signed in to delete photos');
        return;
      }

      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Close the lightbox
        setSelectedPhoto(null);
        // Refresh the photos list with a small delay to ensure DB has updated
        setTimeout(() => {
          fetchPhotos();
        }, 300);
        alert('Photo deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('An error occurred while deleting the photo');
    }
  };

  const canDeletePhoto = (photo: Photo): boolean => {
    // Check if the current user uploaded this photo (compares usernames)
    return isAuthed && !!profileLoadedName && photo.uploaded_by === profileLoadedName;
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const toggleQrInline = async () => {
    const next = !showQrInline;
    setShowQrInline(next);
    if (next) {
      setQrDataUrl(null);
      try {
        const url = window.location.href;
        const dataUrl = await qrToDataURL(url, {
          margin: 1,
          scale: 6,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        setQrDataUrl(dataUrl);
      } catch (e) {
        // console.error('QR generation failed', e); // debug disabled for deployment
      }
    }
  };

  // Close QR popover on outside click
  useEffect(() => {
    if (!showQrInline) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (qrAreaRef.current && !qrAreaRef.current.contains(target)) {
        setShowQrInline(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showQrInline]);

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-500 mb-4"></div>
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="font-semibold flex items-center gap-2 transition-colors glass px-4 py-2 rounded-xl shadow-md hover:shadow-lg border border-subtle"
          >
            <span>←</span> Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="relative z-20 glass-strong rounded-2xl shadow-xl p-6 mb-6 border border-subtle">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight">{album.name}</h1>
              <p className="text-muted font-medium">
                <span className="inline-flex items-center gap-2">
                  <span className="text-violet-400">📷</span>
                  {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </span>
              </p>
            </div>
            <div className="relative flex items-center gap-3" ref={qrAreaRef}>
              <button
                onClick={copyShareLink}
                className="accent hover:brightness-110 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>📋</span> Copy Share Link
              </button>
              <button
                onClick={toggleQrInline}
                className="glass border border-subtle font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                title="Show QR code for this album"
              >
                <span>🔗</span> QR Code
              </button>

              {showQrInline && (
                <div className="absolute right-0 top-full mt-2 glass-strong border border-subtle rounded-2xl shadow-2xl p-4 z-1000 w-[18rem]">
                  <div className="text-sm font-semibold mb-2">Scan to open</div>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Album QR" className="w-full h-auto rounded-md" />
                  ) : (
                    <div className="text-muted text-sm">Generating QR…</div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted truncate max-w-40" title={typeof window !== 'undefined' ? window.location.href : ''}>
                      {typeof window !== 'undefined' ? window.location.href : ''}
                    </div>
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download={`album-qr-${album?.id || ''}.png`}
                        className="text-violet-300 hover:text-violet-200 text-sm font-bold"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload CTA moved to dedicated page */}
        <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6 border border-subtle flex items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span>📸</span> Add Photos
            </h2>
            <p className="text-muted text-sm">Photos are now uploaded from a dedicated page for a cleaner experience.</p>
          </div>
          {isAuthed ? (
            <a
              href={`/album/${albumId}/upload`}
              className="accent hover:brightness-110 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>➕</span> Go to Upload Page
            </a>
          ) : (
            <div className="flex flex-col gap-2 text-center">
              <p className="text-xs text-muted">Sign in to upload photos.</p>
              <div className="flex gap-2">
                <a href={`/auth/login?next=/album/${albumId}/upload`} className="accent px-4 py-2 rounded-xl text-sm font-semibold">Sign In</a>
                <a href={`/auth/register?next=/album/${albumId}/upload`} className="glass px-4 py-2 rounded-xl text-sm font-semibold border border-subtle">Create Account</a>
              </div>
            </div>
          )}
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="glass-strong rounded-2xl shadow-xl p-16 text-center border border-subtle">
            <div className="text-7xl mb-6">📷</div>
            <h3 className="text-2xl font-bold mb-3">No photos yet</h3>
            <p className="text-muted text-lg">Be the first to upload a photo to this album!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group glass rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-subtle"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={photo.url || (photo.filename.includes('/')
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'')}/storage/v1/object/public/uploads/${photo.filename}`
                      : `/uploads/${photo.filename}`)}
                    alt={photo.original_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold truncate">{photo.title || photo.original_name}</p>
                  {photo.uploaded_by && (
                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <span>👤</span> {photo.uploaded_by}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-subtle bg-[#0f0f14] min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Section */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              <div className="relative w-full h-[50vh] md:h-full">
                <Image
                  src={selectedPhoto.url || (selectedPhoto.filename.includes('/')
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'')}/storage/v1/object/public/uploads/${selectedPhoto.filename}`
                    : `/uploads/${selectedPhoto.filename}`)}
                  alt={selectedPhoto.original_name}
                  fill
                  className="object-contain"
                />
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 glass rounded-full w-10 h-10 flex items-center justify-center text-xl border border-subtle"
              >
                ×
              </button>
              <div className="absolute bottom-4 right-4 flex gap-2">
                {canDeletePhoto(selectedPhoto) && (
                  <button
                    onClick={() => handleDeletePhoto(selectedPhoto)}
                    className="glass rounded-lg px-4 py-2 font-semibold border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    🗑️ Delete
                  </button>
                )}
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="glass rounded-lg px-4 py-2 font-semibold border border-subtle hover:bg-white/5 transition-all"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="w-full md:w-96 bg-[#111118] flex flex-col max-h-[40vh] md:max-h-full border-l border-subtle min-h-0">
              <div className="p-4 border-b border-subtle glass">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span>💬</span>
                  {selectedPhoto.title || selectedPhoto.original_name}
                </h3>
                {selectedPhoto.uploaded_by && (
                  <p className="text-sm text-muted mt-1 flex items-center gap-1">
                    <span>👤</span> {selectedPhoto.uploaded_by}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">💭</div>
                    <p className="text-muted font-medium">No comments yet</p>
                    <p className="text-muted text-sm mt-1">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="glass rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-subtle">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 text-white font-bold">
                          {comment.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {comment.username ? (
                              <Link 
                                href={`/user/${comment.username}`}
                                className="font-bold text-sm truncate hover:text-violet-300 transition-colors hover:underline"
                              >
                                {comment.author_name}
                              </Link>
                            ) : (
                              <span className="font-bold text-sm truncate">{comment.author_name}</span>
                            )}
                            <span className="text-xs text-muted">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed wrap-break-word">{comment.content}</p>
                          {/* Interaction buttons (Like/Reply) removed for now; reserved space for future features */}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                  {/* Legacy QR modal removed: replaced by inline popover */}

              </div>

              <form onSubmit={handleAddComment} className="p-4 border-t border-subtle space-y-3">
                {profileLoadedName && (
                  <div className="text-xs text-muted">Commenting as <span className="font-semibold text-white">{profileLoadedName}</span></div>
                )}
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-sm resize-none text-white placeholder:text-muted transition-all"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="w-full accent hover:brightness-110 disabled:brightness-75 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingComment ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : (
                    <>
                      <span>💬</span> Post Comment
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Legacy inline upload modal removed in favor of dedicated page */}
    </div>
  );
}
