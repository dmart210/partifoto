"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [changing, setChanging] = useState(false);
  const router = useRouter();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    setChanging(true);
    
    try {
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError('Unable to verify user.');
        return;
      }
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        setError('Current password is incorrect.');
        return;
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      // Success
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to account page after 2 seconds
      setTimeout(() => {
        router.push('/account');
      }, 2000);
      
    } catch (e: any) {
      setError(e.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 md:mb-6">
          <Link 
            href="/account" 
            className="text-purple-300 hover:text-purple-200 inline-flex items-center gap-2 mb-3 md:mb-4 text-sm md:text-base"
          >
            <span>←</span> Back to Account Settings
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold">Change Password</h1>
        </div>

        <div className="glass-strong rounded-2xl p-6 md:p-8 border border-subtle shadow-xl">
          <form onSubmit={handlePasswordChange} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white text-base"
                disabled={changing}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white text-base"
                disabled={changing}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white text-base"
                disabled={changing}
                autoComplete="new-password"
              />
            </div>

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm md:text-base">
                Password changed successfully! Redirecting...
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm md:text-base">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                type="submit"
                disabled={changing || success}
                className="flex-1 accent hover:brightness-110 disabled:brightness-75 text-white font-bold py-3 px-4 md:px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed text-sm md:text-base"
              >
                {changing ? 'Changing Password...' : 'Change Password'}
              </button>
              <Link
                href="/account"
                className="px-4 md:px-6 py-3 border-2 border-subtle hover:border-white/30 rounded-xl font-bold transition-all text-center text-sm md:text-base"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
