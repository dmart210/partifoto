"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { optimizeImage } from '@/lib/imageOpt';

export default function RegisterPage() {
  const router = useRouter();
  const [next, setNext] = useState('/');
  const [autoRedirect, setAutoRedirect] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const n = url.searchParams.get('next');
        if (n) setNext(n);
      } catch {}
    }
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace(next);
    })();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // If project requires email confirmation, there may be no session yet.
    // Try to sign in immediately to continue the flow; if that fails with
    // an email-confirmation error, surface a helpful message.
    let authed = !!data.session;
    if (!authed) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setLoading(false);
        const msg = /confirm|verified/i.test(signInErr.message)
          ? 'Please verify your email, then sign in to continue.'
          : signInErr.message;
        setError(msg);
        return;
      }
      authed = true;
    }

    // Create profiles row (only after session exists so RLS allows it)
    if (authed) {
      const who = await supabase.auth.getUser();
      const uid = who.data.user?.id;
      if (uid) {
        let avatarPublicUrl: string | undefined;
        if (avatarFile) {
          setUploadingAvatar(true);
          try {
            let working = avatarFile;
            try {
              working = await optimizeImage(avatarFile, { maxWidth: 512, maxHeight: 512, quality: 0.85, format: 'image/webp' });
            } catch {}
            const path = `${uid}/${Date.now()}-${working.name}`;
            const { error: upErr } = await supabase.storage.from('avatars').upload(path, working, { upsert: false, contentType: working.type });
            if (!upErr) {
              const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
              avatarPublicUrl = pub.publicUrl;
            } else {
              // console.warn('Avatar upload failed', upErr); // debug disabled for deployment
            }
          } finally {
            setUploadingAvatar(false);
          }
        }
        const normalizeHandleToUrl = (raw: string, service: 'instagram' | 'twitter'): string | undefined => {
          let val = (raw || '').trim();
            if (!val) return undefined;
            val = val.replace(/^@+/, '').replace(/\s+/g, '');
            if (!val) return undefined;
            const base = service === 'instagram' ? 'https://instagram.com' : 'https://twitter.com';
            if (/^https?:\/\//i.test(val)) {
              try {
                const u = new URL(val);
                const host = u.hostname.toLowerCase();
                if ((!host.includes('instagram.com') && !host.includes('twitter.com') && !host.includes('x.com')) && !host.includes('.')) {
                  return `${base}/${host}${u.pathname || ''}`;
                }
                return u.toString();
              } catch { return undefined; }
            }
            if (val.includes('.')) return `https://${val}`;
            return `${base}/${val}`;
        };

        const { error: profErr } = await supabase
          .from('profiles')
          .upsert({
            id: uid,
            username: username || email,
            display_name: username || email,
            avatar_url: avatarPublicUrl,
            instagram_url: normalizeHandleToUrl(instagram, 'instagram'),
            twitter_url: normalizeHandleToUrl(twitter, 'twitter'),
          });
  if (profErr) { /* console.warn('Profile upsert failed', profErr); */ } // debug disabled for deployment
      }
    }

    setLoading(false);
    setAutoRedirect(true);
    setTimeout(() => router.replace(next), 600); // small UX delay
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <button onClick={() => router.back()} className="font-semibold flex items-center gap-2 text-muted hover:text-white">
            <span>←</span> Back
          </button>
        </div>
        <div className="glass-strong rounded-2xl shadow-2xl p-8 border border-subtle">
          <h1 className="text-3xl font-extrabold mb-6">Create account</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. partyhost"
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2">Instagram (optional)
                  <span className="inline-block w-4 h-4">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-pink-400">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                    </svg>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value.replace(/^@+/, ''))}
                    placeholder="yourhandle"
                    className="w-full pl-10 pr-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-white placeholder:text-muted"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400">@</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2">Twitter (optional)
                  <span className="inline-block w-4 h-4">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sky-400">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.88-2.36 8.52 8.52 0 0 1-2.7 1.03 4.24 4.24 0 0 0-7.23 3.87A12.04 12.04 0 0 1 3.16 4.9a4.22 4.22 0 0 0 1.31 5.66 4.18 4.18 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.16 4.3 4.3 0 0 1-1.91.07 4.25 4.25 0 0 0 3.96 2.95A8.5 8.5 0 0 1 2 19.54a12 12 0 0 0 6.52 1.91c7.82 0 12.1-6.48 12.1-12.1 0-.19 0-.39-.01-.58A8.67 8.67 0 0 0 22.46 6z" />
                    </svg>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value.replace(/^@+/, ''))}
                    placeholder="yourhandle"
                    className="w-full pl-10 pr-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-white placeholder:text-muted"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400">@</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Avatar (optional)</label>
              <label className="flex flex-col items-center justify-center gap-3 p-4 border-2 border-dashed border-subtle rounded-xl cursor-pointer hover:border-purple-600 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="text-muted text-xs">Click to choose image</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setAvatarFile(f);
                      const url = URL.createObjectURL(f);
                      setPreviewUrl(url);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              {uploadingAvatar && <div className="text-xs text-muted mt-2">Uploading avatar…</div>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading || uploadingAvatar} className="w-full accent hover:brightness-110 text-white font-bold py-3 px-5 rounded-xl transition-all">
              {loading ? 'Creating…' : 'Create account'}
            </button>
            {autoRedirect && (
              <div className="text-xs text-muted text-center animate-pulse">Account created — taking you to the next step…</div>
            )}
          </form>
          <div className="mt-4 text-sm">Already have an account? <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-violet-300 hover:underline">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}
