'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAlbum() {
  const [albumName, setAlbumName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const [entered, setEntered] = useState(false);

  // simple enter animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: albumName }),
      });

      if (response.ok) {
        const album = await response.json();
        router.push(`/album/${album.id}`);
      } else {
        alert('Failed to create album');
      }
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Failed to create album');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={`min-h-screen p-8 transition-all duration-300 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="font-semibold flex items-center gap-2 transition-colors text-muted hover:text-white"
          >
            <span>←</span> Back to Home
          </button>
        </div>

        <div className="glass-strong rounded-2xl shadow-2xl p-10 border border-subtle">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Create New Partifoto Album</h1>
            <p className="text-muted">Give your album a memorable name</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="albumName" className="block text-sm font-bold mb-3">
                Album Name
              </label>
              <input
                type="text"
                id="albumName"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="e.g., Summer BBQ 2024"
                className="w-full px-5 py-4 border-2 border-subtle bg-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none text-white placeholder:text-muted text-lg transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !albumName.trim()}
              className="w-full accent hover:brightness-110 disabled:brightness-75 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed text-lg"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                '✨ Create Album ✨'
              )}
            </button>
          </form>

          <div className="mt-8 p-5 glass rounded-xl border border-subtle">
            <p className="text-sm leading-relaxed">
              <strong>💡 Tip:</strong> After creating your album, you&apos;ll get a shareable link that you can send to your guests through Partiful or any messaging app!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
