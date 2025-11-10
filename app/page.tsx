"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    // Reload state
    setAuthLoading(true);
    setEmail('');
    setPassword('');
    const { data } = await supabase.auth.getUser();
    setUserEmail(data.user?.email ?? null);
    const { data: prof } = await supabase.from('profiles').select('*').single();
    if (prof?.username) setUsername(prof.username as string);
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
    } else {
      setRecentAlbums([]);
    }
    setAuthLoading(false);
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setUsername(null);
    setRecentAlbums([]);
  };

  return (
    <div className={`min-h-screen p-8 transition-all duration-300 ease-out ${exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`} aria-busy={exiting}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 mt-8">
          <div className="inline-block mb-6">
            <span className="text-6xl">📸</span>
          </div>
          <h1 className="text-6xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400">
            Partifoto
          </h1>
          <p className="text-2xl text-muted font-medium">
            Share memories, not just moments
          </p>
        </div>

        {/* Move Get Started to the next step (after login) */}

        {/* Step 1: Account */}
        <div className="glass-strong rounded-2xl shadow-xl p-8 mb-10 border border-subtle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Account</h2>
            {!authLoading && userEmail && (
              <button onClick={onSignOut} className="glass px-3 py-2 rounded-xl border border-subtle text-sm">Sign out</button>
            )}
          </div>

          {authLoading ? (
            <div className="text-muted">Loading…</div>
          ) : userEmail ? (
            <div className="space-y-6">
              <div className="glass rounded-xl p-4 border border-subtle">
                <div className="text-sm text-muted">Signed in as</div>
                <div className="font-bold">{username || userEmail}</div>
              </div>
              <div>
                <Link href="/account" className="text-sm text-violet-300 hover:underline">Edit profile</Link>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Recent Albums</h3>
                  <Link className="text-sm text-violet-300 hover:underline" href="/my">View all</Link>
                </div>
                {recentAlbums.length === 0 ? (
                  <div className="text-sm text-muted">No recent albums yet. Visit or interact with an album and it will appear here.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {recentAlbums.slice(0, 6).map((a) => (
                      <Link key={a.id} href={`/album/${a.id}`} className="group glass rounded-xl p-4 border border-subtle hover:shadow-lg transition-all">
                        <div className="font-semibold group-hover:text-violet-300">{a.name}</div>
                        <div className="text-xs text-muted">Created {new Date(a.created_at).toLocaleDateString()}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <form onSubmit={onSignIn} className="space-y-4 max-w-md">
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
                {authError && <div className="text-red-400 text-sm">{authError}</div>}
                <div className="flex items-center gap-3">
                  <button type="submit" className="accent hover:brightness-110 text-white font-bold py-3 px-5 rounded-xl transition-all">Sign in</button>
                  <Link href="/auth/register" className="text-sm text-violet-300 hover:underline">Create an account</Link>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Step 2: Next step after login - Create or open an album */}
        {userEmail && (
          <div className="glass-strong rounded-2xl shadow-xl p-8 mb-10 border border-subtle">
            <h2 className="text-2xl font-bold mb-6">Next step</h2>

            <div className="space-y-4">
              <button
                onClick={handleCreate}
                className="group block w-full accent hover:brightness-110 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 text-center shadow-lg hover:shadow-violet-700/40 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">✨</span>
                  Create New Album
                  <span className="text-xl">✨</span>
                </span>
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="border-t border-subtle grow"></div>
                <span className="px-4 text-muted font-medium">or</span>
                <div className="border-t border-subtle grow"></div>
              </div>

              <div className="border border-dashed border-subtle rounded-xl p-8 text-center bg-linear-to-br from-violet-950/40 to-fuchsia-900/30 hover:from-violet-900/50 hover:to-fuchsia-800/40 transition-colors">
                <p className="mb-2 font-semibold">Have a link? 🔗</p>
                <p className="text-sm text-muted">Paste it in your browser to access the album</p>
                <code className="text-xs text-violet-300 bg-violet-900/40 px-3 py-1 rounded-full inline-block mt-3">
                  /album/abc123xyz
                </code>
              </div>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-6">
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
