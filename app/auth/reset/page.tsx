"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace('/');
    })();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || '';
      const redirectTo = `${origin}/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-extrabold mb-2">Reset password</h1>
          <p className="text-sm text-muted mb-6">Enter your account email and we’ll send you a secure link to set a new password.</p>

          {sent ? (
            <div className="p-4 glass rounded-xl border border-subtle text-sm">
              If an account exists for <span className="font-semibold">{email}</span>, you’ll receive an email with a reset link.
            </div>
          ) : (
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
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full accent hover:brightness-110 text-white font-bold py-3 px-5 rounded-xl transition-all">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
