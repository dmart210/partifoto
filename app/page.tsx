"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const handleCreate = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setExiting(true);
    setTimeout(() => router.push('/create-album'), 250);
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

        <div className="glass-strong rounded-2xl shadow-xl p-8 mb-10 border border-subtle">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>
          
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
