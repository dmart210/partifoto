"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.push('/')} className="font-semibold flex items-center gap-2 text-muted hover:text-white">
            <span>←</span> Back to website
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-subtle shadow-2xl grid md:grid-cols-2 bg-black/10">
          {/* Visual panel with hero image */}
          <div className="hidden md:block relative">
            <Image src="/hero-signin.png" alt="Friends capturing a group moment" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-br from-black/60 via-black/40 to-black/70" />
            <div className="relative h-full p-8 flex flex-col justify-end">
              <div className="text-sm text-muted mb-2">Capturing Moments, Creating Memories</div>
              <div className="text-xl font-extrabold">Partifoto</div>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-8 glass-strong md:rounded-none rounded-2xl border-l border-subtle">
            <h1 className="text-3xl font-extrabold mb-2">Sign in</h1>
            <p className="text-sm text-muted mb-6">Welcome back. Enter your credentials to continue.</p>
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
              <div className="text-sm flex items-center justify-between text-muted">
                <Link href="/auth/reset" className="hover:text-white underline-offset-2 hover:underline">Forgot password?</Link>
                <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="hover:underline hover:text-violet-300">Create an account</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
