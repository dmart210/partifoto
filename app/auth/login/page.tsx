"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState('/');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Parse next param client-side to avoid SSR searchParams requirement
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace(next);
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
          <h1 className="text-3xl font-extrabold mb-6">Sign in</h1>
          <form onSubmit={onSubmit} className="space-y-4">
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
            <button type="submit" disabled={loading} className="w-full accent hover:brightness-110 text-white font-bold py-3 px-5 rounded-xl transition-all">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="mt-4 text-sm">
            Don&apos;t have an account?{' '}
            <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="text-violet-300 hover:underline">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
