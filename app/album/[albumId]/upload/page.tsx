"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { optimizeImage } from '@/lib/imageOpt';

export default function AlbumUploadPage() {
  const params = useParams();
  const albumId = params.albumId as string;
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [albumName, setAlbumName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [nameChoice, setNameChoice] = useState<'username' | 'display_name' | 'custom'>('username');

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthed(!!user);
        
        // Fetch user profile if authenticated
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUsername(profile.username || '');
            setDisplayName(profile.display_name || '');
            // Default to username
            setUploadName(profile.username || '');
          }
        }
      } catch (e) {
        // console.warn('Auth check failed', e); // debug disabled for deployment
      } finally {
        setAuthChecked(true);
      }
      // Fetch album name for context
      try {
        const res = await fetch(`/api/albums/${albumId}`);
        if (res.ok) {
          const data = await res.json();
          setAlbumName(data.name || 'Album');
        }
      } catch {}
    };
    init();
  }, [albumId]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    e.target.value = '';
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadName(username); // Reset to username
    setNameChoice('username');
    setPhotoTitle('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleNameChoiceChange = (choice: 'username' | 'display_name' | 'custom') => {
    setNameChoice(choice);
    if (choice === 'username') {
      setUploadName(username);
    } else if (choice === 'display_name') {
      setUploadName(displayName);
    } else {
      setUploadName(''); // Clear for custom input
    }
  };

  const doUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      let workingFile = selectedFile;
      try {
        const optimized = await optimizeImage(selectedFile, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 });
        if (optimized !== selectedFile) {
          workingFile = optimized;
        }
      } catch (e) {
        // console.warn('Optimization failed; using original', e); // debug disabled for deployment
      }
      const formData = new FormData();
      formData.append('file', workingFile);
      if (uploadName.trim()) formData.append('uploadedBy', uploadName.trim());
      if (photoTitle.trim()) formData.append('title', photoTitle.trim());
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/albums/${albumId}/photos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text();
        alert('Upload failed: ' + msg);
        return;
      }
      reset();
      // After upload, go back to album
      router.push(`/album/${albumId}`);
    } catch (e) {
      // console.error('Upload error', e); // debug disabled for deployment
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => router.push(`/album/${albumId}`)} className="glass px-4 py-2 rounded-xl border border-subtle font-semibold flex items-center gap-2">
            <span>←</span> Back to Album
          </button>
          <a href="/" className="text-sm text-muted hover:text-white transition-colors">Home</a>
        </div>
        {!authChecked ? (
          <div className="glass-strong rounded-2xl p-10 border border-subtle text-center">
            <div className="animate-pulse text-muted">Checking auth…</div>
          </div>
        ) : !isAuthed ? (
          <div className="glass-strong rounded-2xl p-10 border border-subtle text-center space-y-6">
            <div className="text-5xl">🔒</div>
            <h1 className="text-3xl font-extrabold">Sign in required</h1>
            <p className="text-muted">You must be signed in to upload photos to this album.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href={`/auth/login?next=/album/${albumId}/upload`} className="accent px-6 py-3 rounded-xl font-semibold">Sign In</a>
              <a href={`/auth/register?next=/album/${albumId}/upload`} className="glass px-6 py-3 rounded-xl font-semibold border border-subtle">Create Account</a>
            </div>
          </div>
        ) : (
          <div className="glass-strong rounded-2xl p-8 md:p-10 border border-subtle">
            <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2"><span>📸</span> Upload to {albumName}</h1>
            <p className="text-muted mb-8 text-sm">Choose an image, optionally add a name & caption, then upload.</p>
            <div className="space-y-8">
              <div>
                <label className="group cursor-pointer block">
                  <div className="accent hover:brightness-110 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-center shadow-lg hover:shadow-xl transform group-hover:-translate-y-0.5">
                    {selectedFile ? 'Change Photo' : '✨ Choose Photo ✨'}
                  </div>
                  <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                </label>
                {selectedFile && (
                  <div className="mt-4 p-4 glass rounded-xl border border-subtle">
                    <p className="text-xs text-muted mb-1 uppercase font-semibold tracking-wide">Selected:</p>
                    <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="rounded-xl overflow-hidden bg-black/30 shadow-lg">
                  <div className="relative aspect-video">
                    <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Display As</label>
                  <div className="space-y-3">
                    <select
                      value={nameChoice}
                      onChange={(e) => handleNameChoiceChange(e.target.value as 'username' | 'display_name' | 'custom')}
                      className="w-full px-4 py-3 border-2 border-subtle bg-[#1a1a1f] rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white text-base"
                    >
                      {username && <option value="username">Username ({username})</option>}
                      {displayName && <option value="display_name">Display Name ({displayName})</option>}
                      <option value="custom">Custom Name</option>
                    </select>
                    {nameChoice === 'custom' && (
                      <input
                        type="text"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="Enter custom name"
                        className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted text-base"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Photo Title / Caption <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="e.g. Opening toast!"
                    className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted text-base"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  disabled={!selectedFile || uploading}
                  className="flex-1 bg-white/5 hover:bg-white/10 font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={doUpload}
                  disabled={!selectedFile || uploading}
                  className="flex-1 accent hover:brightness-110 disabled:brightness-75 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading…' : '✨ Upload ✨'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
