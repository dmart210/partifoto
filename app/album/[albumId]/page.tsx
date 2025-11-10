'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Album, Photo, Comment } from '@/lib/types';
import { toDataURL as qrToDataURL } from 'qrcode';
import { optimizeImage } from '@/lib/imageOpt';

export default function AlbumPage() {
  const params = useParams();
  const albumId = params.albumId as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showQrInline, setShowQrInline] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAlbum();
    fetchPhotos();
  }, [albumId]);

  useEffect(() => {
    if (selectedPhoto) {
      fetchComments(selectedPhoto.id);
    }
  }, [selectedPhoto]);

  const fetchAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      if (response.ok) {
        const data = await response.json();
        setAlbum(data);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const fetchComments = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Show modal with file selected
    setSelectedFile(file);
    setShowUploadModal(true);
    e.target.value = ''; // Reset file input
  };

  const confirmUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Optimize image before upload
      let workingFile = selectedFile;
      try {
        const optimized = await optimizeImage(selectedFile, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 });
        if (optimized !== selectedFile) {
          console.log('[ImageOpt] original', (selectedFile.size/1024).toFixed(1)+'KB', '-> optimized', (optimized.size/1024).toFixed(1)+'KB');
          workingFile = optimized;
        } else {
          console.log('[ImageOpt] no optimization applied (already small or unsuitable) size', (selectedFile.size/1024).toFixed(1)+'KB');
        }
      } catch (optErr) {
        console.warn('Image optimization failed, using original file:', optErr);
      }

      const formData = new FormData();
      formData.append('file', workingFile);
      if (uploadName.trim()) {
        formData.append('uploadedBy', uploadName);
      }
      if (photoTitle.trim()) {
        formData.append('title', photoTitle);
      }

      const response = await fetch(`/api/albums/${albumId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchPhotos();
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadName('');
        setPhotoTitle('');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        const txt = await response.text();
        console.error('Upload failed response:', txt);
        alert('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto || !userName.trim() || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/photos/${selectedPhoto.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: userName,
          content: commentText,
        }),
      });

      if (response.ok) {
        setCommentText('');
        fetchComments(selectedPhoto.id);
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
        console.error('QR generation failed', e);
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

        {/* Upload Section */}
        <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6 border border-subtle">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📸</span> Upload Photo
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex-1 cursor-pointer group">
              <div className="accent hover:brightness-110 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  '✨ Choose Photo ✨'
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
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
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="absolute bottom-4 right-4 glass rounded-lg px-4 py-2 font-semibold border border-subtle"
              >
                ⬇️ Download
              </button>
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
                            <span className="font-bold text-sm truncate">{comment.author_name}</span>
                            <span className="text-xs text-muted">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed wrap-break-word">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                            <button className="hover:text-violet-300 transition-colors flex items-center gap-1">
                              <span>👍</span> Like
                            </button>
                            <button className="hover:text-violet-300 transition-colors">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                  {/* Legacy QR modal removed: replaced by inline popover */}

              </div>

              <form onSubmit={handleAddComment} className="p-4 border-t border-subtle space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-sm text-white placeholder:text-muted transition-all"
                  required
                />
                <div className="relative">
                  <textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-sm resize-none text-white placeholder:text-muted transition-all pr-24"
                    rows={2}
                    required
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-xl"
                      title="Add GIF (Coming Soon)"
                    >
                      🎬
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-xl"
                      title="Add Sticker (Coming Soon)"
                    >
                      😊
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submittingComment || !userName.trim() || !commentText.trim()}
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

      {/* Upload Modal */}
      {showUploadModal && selectedFile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => {
            setShowUploadModal(false);
            setSelectedFile(null);
            setUploadName('');
            setPhotoTitle('');
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}
        >
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all animate-in zoom-in duration-200 glass-strong border border-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2">
              <span>📸</span> Upload Photo
            </h2>
            
            {/* Photo Preview */}
            {previewUrl && (
              <div className="mb-6 rounded-xl overflow-hidden bg-black/30 shadow-lg">
                <div className="relative aspect-video">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-muted mb-1 font-semibold uppercase tracking-wide">Selected file:</p>
              <p className="font-medium truncate">{selectedFile.name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="uploadName" className="block text-sm font-bold mb-2">
                  Your Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="uploadName"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted transition-all"
                />
              </div>

              <div>
                <label htmlFor="photoTitle" className="block text-sm font-bold mb-2">
                  Photo Title/Caption <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="photoTitle"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g., Best moment of the night!"
                  className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadName('');
                  setPhotoTitle('');
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 font-bold py-3 px-4 rounded-xl transition-all duration-200"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="flex-1 accent hover:brightness-110 disabled:brightness-75 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  '✨ Upload ✨'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
