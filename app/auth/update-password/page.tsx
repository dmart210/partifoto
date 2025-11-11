"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // After following the email link, Supabase sets a recovery session.
    // We check for a session before allowing password update.
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setReady(true);
      if (!session) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      setSuccess(true);
      // Optionally redirect to login after a short delay
      setTimeout(() => router.replace('/auth/login'), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="font-semibold flex items-center gap-2 text-muted hover:text-white">
            <span>←</span> Home
          </button>
        </div>

        <div className="glass-strong rounded-2xl shadow-2xl p-8 border border-subtle">
          <h1 className="text-3xl font-extrabold mb-2">Set a new password</h1>
          <p className="text-sm text-muted mb-6">Choose a strong password you don’t use elsewhere.</p>

          {!ready ? (
            <div className="text-muted">Preparing…</div>
          ) : success ? (
            <div className="p-4 glass rounded-xl border border-subtle text-sm text-green-400">Password updated. Redirecting…</div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted"
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full accent hover:brightness-110 text-white font-bold py-3 px-5 rounded-xl transition-all">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
