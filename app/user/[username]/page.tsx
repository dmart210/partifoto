"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const normalizeSocialUrl = (raw: string | null, service: 'instagram' | 'twitter'): string | null => {
    let val = (raw || '').trim();
    if (!val) return null;
    val = val.replace(/^@+/, '').replace(/\s+/g, '');
    if (!val) return null;
    const base = service === 'instagram' ? 'https://instagram.com' : 'https://twitter.com';
    if (/^https?:\/\//i.test(val)) {
      try {
        const u = new URL(val);
        const host = u.hostname.toLowerCase();
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
    const loadProfile = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, instagram_url, twitter_url, created_at')
          .eq('username', username)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setProfile(data as UserProfile);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="glass-strong rounded-2xl p-8 border border-subtle text-center">
            <div className="text-muted">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <div className="glass-strong rounded-2xl p-8 border border-subtle text-center">
            <div className="text-5xl mb-4">👤</div>
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted mb-6">The user @{username} doesn&apos;t exist or their profile is private.</p>
            <Link href="/" className="accent px-6 py-3 rounded-xl inline-block hover:brightness-110 transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const instagramUrl = normalizeSocialUrl(profile.instagram_url, 'instagram');
  const twitterUrl = normalizeSocialUrl(profile.twitter_url, 'twitter');
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="glass px-4 py-2 rounded-xl border border-subtle mb-6 hover:bg-white/5 transition-all flex items-center gap-2"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        {/* Profile Card */}
        <div className="glass-strong rounded-2xl shadow-2xl border border-subtle overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative h-32 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600">
            <div className="absolute inset-0 bg-linear-to-br from-black/20 to-black/40" />
          </div>

          {/* Avatar and Info */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 relative z-10">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[rgb(var(--background))] shadow-xl bg-white/5">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.display_name || profile.username} 
                    width={128} 
                    height={128} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    👤
                  </div>
                )}
              </div>

              {/* Name and username */}
              <div className="flex-1 sm:mb-4">
                <h1 className="text-3xl font-extrabold mb-1">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-muted text-lg">@{profile.username}</p>
              </div>
            </div>

            {/* Member since */}
            <div className="mt-6 pt-6 border-t border-subtle">
              <p className="text-sm text-muted">
                <span className="font-semibold">Member since:</span> {memberSince}
              </p>
            </div>

            {/* Social Links */}
            {(instagramUrl || twitterUrl) && (
              <div className="mt-6 pt-6 border-t border-subtle">
                <h2 className="text-sm font-bold mb-4 text-muted uppercase tracking-wide">Social Links</h2>
                <div className="flex flex-wrap gap-3">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 glass px-4 py-3 rounded-xl border border-subtle hover:border-pink-500/50 hover:bg-white/5 transition-all group"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-5 h-5 text-pink-400 group-hover:text-pink-300"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                      </svg>
                      <span className="font-medium">Instagram</span>
                    </a>
                  )}
                  {twitterUrl && (
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 glass px-4 py-3 rounded-xl border border-subtle hover:border-sky-500/50 hover:bg-white/5 transition-all group"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-5 h-5 text-sky-400 group-hover:text-sky-300"
                      >
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.88-2.36 8.52 8.52 0 0 1-2.7 1.03 4.24 4.24 0 0 0-7.23 3.87A12.04 12.04 0 0 1 3.16 4.9a4.22 4.22 0 0 0 1.31 5.66 4.18 4.18 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.16 4.3 4.3 0 0 1-1.91.07 4.25 4.25 0 0 0 3.96 2.95A8.5 8.5 0 0 1 2 19.54a12 12 0 0 0 6.52 1.91c7.82 0 12.1-6.48 12.1-12.1 0-.19 0-.39-.01-.58A8.67 8.67 0 0 0 22.46 6z" />
                      </svg>
                      <span className="font-medium">Twitter</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Empty state for no social links */}
            {!instagramUrl && !twitterUrl && (
              <div className="mt-6 pt-6 border-t border-subtle text-center py-8">
                <div className="text-4xl mb-3">🔗</div>
                <p className="text-muted">No public social links available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
