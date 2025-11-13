"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AvatarMenu() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState<string | null>(null);
  const [twitterUrl, setTwitterUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement | null>(null);

  const normalizeSocialUrl = (raw: string | null, service: 'instagram' | 'twitter'): string | null => {
    let val = (raw || '').trim();
    if (!val) return null;
    // Strip leading @ and whitespace
    val = val.replace(/^@+/, '').replace(/\s+/g, '');
    if (!val) return null;
    const base = service === 'instagram' ? 'https://instagram.com' : 'https://twitter.com';
    if (/^https?:\/\//i.test(val)) {
      try {
        const u = new URL(val);
        const host = u.hostname.toLowerCase();
        // Repair malformed https://{handle}
        if ((!host.includes('instagram.com') && !host.includes('twitter.com') && !host.includes('x.com')) && !host.includes('.')) {
          return `${base}/${host}${u.pathname || ''}`;
        }
        return u.toString();
      } catch {
        return null;
      }
    }
    if (val.includes('.')) return `https://${val}`;
    return `${base}/${val}`;
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, username, instagram_url, twitter_url')
        .eq('id', user.id)
        .single();
      if (prof) {
        setAvatarUrl(prof.avatar_url || null);
        setDisplayName(prof.display_name || prof.username || user.email || null);
        setUsername(prof.username || (user.email ? user.email.split('@')[0] : null));
        setInstagramUrl(normalizeSocialUrl(prof.instagram_url || null, 'instagram'));
        setTwitterUrl(normalizeSocialUrl(prof.twitter_url || null, 'twitter'));
      }
    })();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const size = 56;

  return (
    <div className="relative inline-flex items-center gap-2" ref={ref}>
      <button
        aria-label="Account"
        onClick={() => setOpen(v => !v)}
        className="rounded-full overflow-hidden border-2 border-subtle shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white/5 ring-1 ring-white/10 transition-all hover:scale-105"
        style={{ width: size, height: size }}
        title={displayName || 'Account'}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Avatar" width={size} height={size} className="object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-2xl">👤</div>
        )}
      </button>

      {username && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-subtle hidden sm:block hover:bg-white/10 transition-all"
          title={`@${username}`}
        >
          @{username}
        </button>
      )}

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-out"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-out drawer */}
          <aside
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] glass-strong border-r border-subtle shadow-2xl z-50 transform transition-transform duration-300 ease-out translate-x-0"
            role="dialog"
            aria-label="Account Menu"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="p-4 border-b border-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-subtle bg-white/5">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-base">👤</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{displayName || 'Account'}</div>
                {username && <div className="text-xs text-muted truncate">@{username}</div>}
              </div>
              <button
                className="ml-auto text-sm px-3 py-1 rounded-lg hover:bg-white/5"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="p-2 space-y-1">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5" onClick={() => { setOpen(false); router.push('/'); }}>Home</button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5" onClick={() => { setOpen(false); router.push('/account'); }}>Account settings</button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5" onClick={() => { setOpen(false); router.push('/my'); }}>My albums</button>
              <div className="h-px bg-white/10 my-2" />
              {/* Social links if present */}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-pink-400">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
              )}
              {twitterUrl && (
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sky-400">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.88-2.36 8.52 8.52 0 0 1-2.7 1.03 4.24 4.24 0 0 0-7.23 3.87A12.04 12.04 0 0 1 3.16 4.9a4.22 4.22 0 0 0 1.31 5.66 4.18 4.18 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.16 4.3 4.3 0 0 1-1.91.07 4.25 4.25 0 0 0 3.96 2.95A8.5 8.5 0 0 1 2 19.54a12 12 0 0 0 6.52 1.91c7.82 0 12.1-6.48 12.1-12.1 0-.19 0-.39-.01-.58A8.67 8.67 0 0 0 22.46 6z" />
                  </svg>
                  <span>Twitter</span>
                </a>
              )}
              <div className="h-px bg-white/10 my-2" />
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5" onClick={logout}>Sign out</button>
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
