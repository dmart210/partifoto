"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ParticipationRow { album_id: string; last_interacted_at: number; }
interface Album { id: string; name: string; created_at: number; }
interface Profile { id: string; username: string; }

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const [{ data: profData }, partRes] = await Promise.all([
        supabase.from('profiles').select('*').single(),
        supabase.from('album_participation').select('*').order('last_interacted_at', { ascending: false })
      ]);

      if (profData) setProfile(profData as Profile);
      const participation = (partRes.data || []) as ParticipationRow[];

      if (participation.length) {
        // Fetch album names in a single query
        const albumIds = participation.map(p => p.album_id);
        const { data: albumRows } = await supabase.from('albums').select('*').in('id', albumIds);
        setAlbums((albumRows || []) as Album[]);
      }
      setLoading(false);
    })();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="glass px-4 py-2 rounded-xl border border-subtle hover:shadow-lg transition-shadow">← Back</button>
            <h1 className="text-3xl font-extrabold">My Albums</h1>
          </div>
          <button onClick={logout} className="glass px-4 py-2 rounded-xl border border-subtle">Sign out</button>
        </div>
        {profile && (
          <div className="glass-strong p-6 rounded-2xl border border-subtle">
            <div className="text-muted text-sm mb-1">Signed in as</div>
            <div className="text-xl font-bold">{profile.username}</div>
          </div>
        )}
        {albums.length === 0 ? (
          <div className="glass-strong p-12 rounded-2xl text-center border border-subtle">
            <p className="text-lg font-semibold mb-2">No album interactions yet.</p>
            <p className="text-sm text-muted">Visit or upload/comment in an album to have it appear here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {albums.map(a => (
              <a key={a.id} href={`/album/${a.id}`} className="group glass rounded-xl p-6 border border-subtle hover:shadow-xl transition-all">
                <h2 className="font-bold text-lg mb-1 group-hover:text-violet-300">{a.name}</h2>
                <p className="text-xs text-muted">Created {new Date(a.created_at).toLocaleDateString()}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
