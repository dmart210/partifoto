"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        // Already logged in, redirect to home
        router.replace('/home');
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
    // Redirect to home after successful login
    router.push('/home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-2xl shadow-2xl p-6 md:p-8 border border-subtle">
          <div className="text-muted">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="glass-strong rounded-2xl shadow-2xl mb-10 border border-subtle overflow-hidden">
          <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6">
            <h2 className="text-xl md:text-2xl font-bold">Sign In</h2>
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
      </div>
    </div>
  );
}
