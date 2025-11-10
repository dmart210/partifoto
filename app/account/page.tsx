"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { optimizeImage } from '@/lib/imageOpt';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/auth/login?next=/account`);
        return;
      }
      let { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!prof) {
        // Auto-create a default profile if missing (use email local-part as username)
        const defaultUsername = (user.email || 'user').split('@')[0];
        await supabase.from('profiles').upsert({ id: user.id, username: defaultUsername });
        const re = await supabase.from('profiles').select('*').eq('id', user.id).single();
        prof = re.data as any;
      }
      if (prof) {
        setProfile(prof as Profile);
        setUsername(prof.username || '');
        setDisplayName(prof.display_name || '');
        setAvatarUrl(prof.avatar_url || null);
        const extractHandle = (incoming?: string | null) => {
          if (!incoming) return '';
          try {
            const u = new URL(incoming);
            const seg = u.pathname.split('/').filter(Boolean)[0];
            return seg || '';
          } catch {}
          return (incoming || '').replace(/^@+/, '');
        };
        setInstagram(extractHandle((prof as any).instagram_url));
        setTwitter(extractHandle((prof as any).twitter_url));
      }
      setLoading(false);
    })();
  }, [router]);

  const normalizeHandleToUrl = (raw: string, service: 'instagram' | 'twitter'): string | null => {
    let val = (raw || '').trim();
    if (!val) return null;
    // strip leading @ and whitespace
    val = val.replace(/^@+/, '').replace(/\s+/g, '');
    if (!val) return null;
    const base = service === 'instagram' ? 'https://instagram.com' : 'https://twitter.com';
    // If it's already a full URL
    if (/^https?:\/\//i.test(val)) {
      try {
        const u = new URL(val);
        const host = u.hostname.toLowerCase();
        // If host doesn't include expected domain and also has no dot, treat as handle in a malformed URL
        if ((!host.includes('instagram.com') && !host.includes('twitter.com') && !host.includes('x.com')) && !host.includes('.')) {
          return `${base}/${host}${u.pathname || ''}`;
        }
        return u.toString();
      } catch {
        return null;
      }
    }
    // If looks like a domain (e.g., instagram.com/user) add https://
    if (val.includes('.')) return `https://${val}`;
    // Otherwise treat as handle
    return `${base}/${val}`;
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      let working = file;
      try {
        working = await optimizeImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.85, format: 'image/webp' });
      } catch {}
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const path = `${user.id}/${Date.now()}-${working.name}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, working, { upsert: false, contentType: working.type });
      if (upErr) {
        setError(upErr.message === 'Bucket not found'
          ? 'Bucket not found. Create a public Storage bucket named "avatars" in Supabase, then try again.'
          : upErr.message);
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uname = (username || '').trim();
      if (!uname) {
        setError('Username is required.');
        setSaving(false);
        return;
      }
      // Use upsert so it works whether the row exists or not
      const { error: upErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: uname,
          display_name: (displayName || '').trim() || null,
          avatar_url: avatarUrl || null,
          instagram_url: normalizeHandleToUrl(instagram, 'instagram'),
          twitter_url: normalizeHandleToUrl(twitter, 'twitter'),
        })
        .select()
        .single();
      if (upErr) {
        setError(upErr.message);
        return;
      }
      // reload profile to reflect changes
      const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (refreshed) {
        setProfile(refreshed as Profile);
        setUsername(refreshed.username || '');
        setDisplayName(refreshed.display_name || '');
        setAvatarUrl(refreshed.avatar_url || null);
        const extractHandle2 = (url?: string | null) => {
          if (!url) return '';
          try {
            const u = new URL(url);
            const seg = u.pathname.split('/').filter(Boolean)[0];
            return seg || '';
          } catch {}
          return url.replace(/^@+/, '');
        };
        setInstagram(extractHandle2((refreshed as any).instagram_url));
        setTwitter(extractHandle2((refreshed as any).twitter_url));
      }
      setError(null);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading account…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Account Settings</h1>
        <button onClick={() => router.push('/')} className="glass px-4 py-2 rounded-xl border border-subtle text-sm">Home</button>
      </div>

      <div className="glass-strong rounded-2xl p-8 border border-subtle shadow-xl space-y-8">
        <section className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4 w-full md:w-56">
            <div className="relative w-40 h-40 rounded-full overflow-hidden bg-white/5 flex items-center justify-center border border-subtle">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-5xl">👤</span>
              )}
            </div>
            <label className="w-full">
              <div className="w-full text-center accent hover:brightness-110 text-white font-bold py-2 px-4 rounded-xl text-sm cursor-pointer">
                {uploading ? 'Uploading…' : 'Change Avatar'}
              </div>
              <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name to show on albums"
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2">Instagram
                  <span className="inline-block w-4 h-4">{/* Instagram icon */}
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
                {(() => {
                  const url = normalizeHandleToUrl(instagram, 'instagram');
                  return url ? (
                    <div className="mt-2 text-sm">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-300 hover:text-pink-200 underline-offset-2 hover:underline"
                      >
                        Open Instagram (@{instagram})
                      </a>
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="text-sm font-bold mb-2 flex items-center gap-2">Twitter
                  <span className="inline-block w-4 h-4">{/* Twitter icon */}
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
            <div className="flex items-center justify-end gap-3">
              {saved && <div className="text-xs text-green-400">Saved</div>}
              <button
                onClick={saveProfile}
                disabled={saving || uploading}
                className="accent hover:brightness-110 disabled:brightness-75 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
          </div>
        </section>

        {/* Debug Info removed for deployment
        <section className="pt-6 border-t border-subtle">
          <h2 className="font-bold mb-4 flex items-center gap-2"><span>🧪</span> Debug Info</h2>
          <pre className="text-xs whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-subtle max-h-60 overflow-y-auto">{JSON.stringify(profile, null, 2)}</pre>
        </section>
        */}
      </div>
    </div>
  );
}
