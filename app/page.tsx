"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [recentAlbums, setRecentAlbums] = useState<Array<{ id: string; name: string; created_at: number }>>([]);

  const handleCreate = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setExiting(true);
    setTimeout(() => router.push('/create-album'), 250);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        // load profile username
        const { data: prof } = await supabase.from('profiles').select('*').single();
        if (prof?.username) setUsername(prof.username as string);
        // load participation
        const { data: parts } = await supabase
          .from('album_participation')
          .select('*')
          .order('last_interacted_at', { ascending: false });
        const albumIds = (parts ?? []).map((p: any) => p.album_id);
        if (albumIds.length) {
          const { data: albums } = await supabase
            .from('albums')
            .select('*')
            .in('id', albumIds);
          setRecentAlbums((albums ?? []) as any);
        }
      }
      setAuthLoading(false);
    };
    load();
  }, []);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
    // Clear form
    setEmail('');
    setPassword('');
    
    // Reload user state
    setAuthLoading(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserEmail(data.user.email ?? null);
      // load profile username
      const { data: prof } = await supabase.from('profiles').select('*').single();
      if (prof?.username) setUsername(prof.username as string);
      // load participation
      const { data: parts } = await supabase
        .from('album_participation')
        .select('*')
        .order('last_interacted_at', { ascending: false });
      const albumIds = (parts ?? []).map((p: any) => p.album_id);
      if (albumIds.length) {
        const { data: albums } = await supabase
          .from('albums')
          .select('*')
          .in('id', albumIds);
        setRecentAlbums((albums ?? []) as any);
      }
    }
    setAuthLoading(false);
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    // Immediately update UI to show signed-out state
    setUserEmail(null);
    setUsername(null);
    setRecentAlbums([]);
    setAuthLoading(false);
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-all duration-300 ease-out ${exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`} aria-busy={exiting}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-16 mt-4 md:mt-8">
          <div className="inline-block mb-4 md:mb-6">
            <span className="text-5xl md:text-6xl">📸</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 md:mb-4 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400">
            Partifoto
          </h1>
          <p className="text-lg md:text-2xl text-muted font-medium px-4">
            Share memories, not just moments
          </p>
        </div>

        {/* Two-column layout for authenticated users, single column for sign-in */}
        {authLoading ? (
          <div className="glass-strong rounded-2xl shadow-2xl p-6 md:p-8 border border-subtle">
            <div className="text-muted">Loading…</div>
          </div>
        ) : userEmail ? (
          <div className="grid lg:grid-cols-[1fr_420px] gap-4 md:gap-6 items-start">
            {/* LEFT COLUMN: Scrollable account details and recent albums */}
            <div className="space-y-4 md:space-y-6">
              {/* Account Card */}
              <div className="glass-strong rounded-2xl shadow-2xl border border-subtle overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6">
                  <h2 className="text-xl md:text-2xl font-bold">Your Account</h2>
                  <button onClick={onSignOut} className="glass px-3 py-2 rounded-xl border border-subtle text-xs md:text-sm hover:bg-white/5 transition-all">Sign out</button>
                </div>
                
                <div className="px-4 md:px-8 pb-6 md:pb-8 space-y-4">
                  <div className="glass rounded-xl p-4 border border-subtle">
                    <div className="text-sm text-muted">Signed in as</div>
                    <div className="font-bold text-sm md:text-base break-all">{username || userEmail}</div>
                  </div>
                  <Link href="/account" className="inline-block text-sm text-violet-300 hover:underline">Edit profile</Link>
                </div>
              </div>

              {/* Recent Albums */}
              <div className="glass-strong rounded-2xl shadow-2xl border border-subtle overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6">
                  <h3 className="text-lg md:text-xl font-bold">Recent Albums</h3>
                  <Link className="text-sm text-violet-300 hover:underline" href="/my">View all</Link>
                </div>
                
                <div className="px-4 md:px-8 pb-6 md:pb-8">
                  {recentAlbums.length === 0 ? (
                    <div className="text-center py-8 md:py-12 border border-dashed border-subtle rounded-xl bg-linear-to-br from-violet-950/20 to-fuchsia-900/20">
                      <div className="text-4xl md:text-5xl mb-3 md:mb-4">📸</div>
                      <p className="text-muted mb-2 text-sm md:text-base">No recent albums yet</p>
                      <p className="text-xs md:text-sm text-muted px-4">Create or visit an album to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recentAlbums.slice(0, 6).map((a) => (
                        <Link key={a.id} href={`/album/${a.id}`} className="group glass rounded-xl p-4 border border-subtle hover:shadow-lg hover:border-violet-500/30 transition-all">
                          <div className="font-semibold group-hover:text-violet-300">{a.name}</div>
                          <div className="text-xs text-muted">Created {new Date(a.created_at).toLocaleDateString()}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky "Next Step" panel */}
            <div className="lg:sticky lg:top-8">
              <div className="glass-strong rounded-2xl shadow-xl p-6 md:p-8 border border-subtle">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Next Step</h2>

                <div className="space-y-4">
                  <button
                    onClick={handleCreate}
                    className="group block w-full accent hover:brightness-110 text-white font-bold py-4 md:py-5 px-6 rounded-xl transition-all duration-300 text-center shadow-lg hover:shadow-violet-700/40 hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg md:text-xl">✨</span>
                      <span className="text-sm md:text-base">Create New Album</span>
                      <span className="text-lg md:text-xl">✨</span>
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center py-3 md:py-4">
                    <div className="border-t border-subtle grow"></div>
                    <span className="px-3 md:px-4 text-sm md:text-base text-muted font-medium">or</span>
                    <div className="border-t border-subtle grow"></div>
                  </div>

                  <div className="border border-dashed border-subtle rounded-xl p-4 md:p-6 text-center bg-linear-to-br from-violet-950/40 to-fuchsia-900/30 hover:from-violet-900/50 hover:to-fuchsia-800/40 transition-colors">
                    <p className="mb-2 font-semibold text-sm md:text-base">Have a link? 🔗</p>
                    <p className="text-xs md:text-sm text-muted">Paste it in your browser to access the album</p>
                    <code className="text-xs text-violet-300 bg-violet-900/40 px-2 md:px-3 py-1 rounded-full inline-block mt-2 md:mt-3 break-all">
                      /album/abc123xyz
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sign-in card for unauthenticated users */
          <div className="glass-strong rounded-2xl shadow-2xl mb-10 border border-subtle overflow-hidden">
            <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6">
              <h2 className="text-xl md:text-2xl font-bold">Your Account</h2>
            </div>

            <div className="px-4 md:px-8 pb-6 md:pb-8">
              <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-subtle bg-black/10">
                {/* Visual panel with hero image */}
                <div className="hidden md:block relative">
                    <Image
                      src="/hero-signin.png"
                    alt="Friends capturing a group moment"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-br from-black/60 via-black/40 to-black/70" />
                  <div className="relative h-full p-8 flex flex-col justify-end">
                    <div className="text-sm text-muted mb-2">Capturing Moments, Creating Memories</div>
                    <div className="text-xl font-extrabold">Welcome to Partifoto</div>
                  </div>
                </div>
                {/* Form panel */}
                <div className="p-6 md:p-8 glass-strong md:rounded-none rounded-2xl border-l border-subtle">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="text-base md:text-lg font-bold">Sign in</div>
                    <Link href="/auth/register" className="text-xs md:text-sm text-violet-300 hover:underline">Create account</Link>
                  </div>
                  <form onSubmit={onSignIn} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted text-base"
                      />
                    </div>
                    {authError && <div className="text-red-400 text-sm">{authError}</div>}
                    <button type="submit" className="w-full accent hover:brightness-110 text-white font-bold py-3 px-5 rounded-xl transition-all">Sign in</button>
                    <div className="text-sm flex items-center justify-between text-muted">
                      <Link href="/auth/reset" className="hover:text-white underline-offset-2 hover:underline">Forgot password?</Link>
                      <Link href="/auth/register" className="hover:underline hover:text-violet-300">Create an account</Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Feature cards - shown for all users */}
        <div className={`grid md:grid-cols-3 gap-6 ${userEmail ? 'mt-12' : 'mt-10'}`}>
          <div className="glass rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-subtle">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="font-bold mb-3 text-lg">Upload Photos</h3>
            <p className="text-sm leading-relaxed text-muted">
              Anyone with the link can add photos to the album instantly
            </p>
          </div>

          <div className="glass rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-subtle">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-bold mb-3 text-lg">Comment &amp; Share</h3>
            <p className="text-sm leading-relaxed text-muted">
              Leave comments on photos and share memories together
            </p>
          </div>

          <div className="glass rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-subtle">
            <div className="text-4xl mb-4">⬇️</div>
            <h3 className="font-bold mb-3 text-lg">Download</h3>
            <p className="text-sm leading-relaxed text-muted">
              Download any photo from the album in full quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
