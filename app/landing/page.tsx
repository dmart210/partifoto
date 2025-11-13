"use client";

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24 mt-8 md:mt-12">
          <div className="inline-block mb-6 md:mb-8">
            <span className="text-6xl md:text-7xl">📸</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 md:mb-6 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400">
            Share Memories Together
          </h1>
          <p className="text-xl md:text-3xl text-muted font-medium px-4 mb-8 md:mb-12">
            The easiest way to collect and share event photos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/" className="accent hover:brightness-110 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-violet-700/40 hover:shadow-xl transform hover:-translate-y-0.5">
              Get Started Free
            </Link>
            <a href="#how-it-works" className="glass px-8 py-4 rounded-xl border border-subtle hover:border-violet-500/50 transition-all font-semibold">
              Learn More
            </a>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-20 md:mt-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
              How It Works
            </h2>
            <p className="text-muted text-base md:text-lg">Three simple steps to start sharing memories</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-20">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-linear-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-xl shadow-violet-500/30">
                  <span className="text-4xl md:text-5xl font-extrabold text-white">1</span>
                </div>
                <div className="absolute -top-1 -right-1 text-4xl md:text-5xl">✨</div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Create Album</h3>
              <p className="text-base md:text-lg text-muted leading-relaxed px-4">
                Create a new album in seconds and get a unique shareable link
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-linear-to-br from-fuchsia-600 to-fuchsia-800 flex items-center justify-center shadow-xl shadow-fuchsia-500/30">
                  <span className="text-4xl md:text-5xl font-extrabold text-white">2</span>
                </div>
                <div className="absolute -top-1 -right-1 text-4xl md:text-5xl">🔗</div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Share Link</h3>
              <p className="text-base md:text-lg text-muted leading-relaxed px-4">
                Share the link with friends and family so they can contribute
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-linear-to-br from-pink-600 to-pink-800 flex items-center justify-center shadow-xl shadow-pink-500/30">
                  <span className="text-4xl md:text-5xl font-extrabold text-white">3</span>
                </div>
                <div className="absolute -top-1 -right-1 text-4xl md:text-5xl">🎉</div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Enjoy Together</h3>
              <p className="text-base md:text-lg text-muted leading-relaxed px-4">
                Everyone can upload, comment, and download photos from the album
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 md:mt-32">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Everything You Need</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-xl p-8 shadow-lg hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border border-subtle group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">📸</div>
              <h3 className="font-bold mb-4 text-2xl group-hover:text-violet-300 transition-colors">Upload Photos</h3>
              <p className="text-base leading-relaxed text-muted">
                Anyone with the link can add photos to the album instantly.
              </p>
            </div>

            <div className="glass rounded-xl p-8 shadow-lg hover:shadow-xl hover:shadow-fuchsia-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border border-subtle group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">💬</div>
              <h3 className="font-bold mb-4 text-2xl group-hover:text-fuchsia-300 transition-colors">Comment &amp; Share</h3>
              <p className="text-base leading-relaxed text-muted">
                Leave comments on photos and share memories together. Engage with your event community.
              </p>
            </div>

            <div className="glass rounded-xl p-8 shadow-lg hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border border-subtle group">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">⬇️</div>
              <h3 className="font-bold mb-4 text-2xl group-hover:text-pink-300 transition-colors">Download</h3>
              <p className="text-base leading-relaxed text-muted">
                Download any photo from the album in full quality. Keep your memories forever.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 md:mt-32 mb-20 text-center glass-strong rounded-3xl p-12 md:p-16 border border-subtle">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6">Ready to Get Started?</h2>
          <p className="text-lg md:text-xl text-muted mb-8 md:mb-10 px-4">
            Create your first album in seconds. No credit card required.
          </p>
          <Link href="/" className="inline-block accent hover:brightness-110 text-white font-bold py-5 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-violet-700/40 hover:shadow-xl transform hover:-translate-y-0.5 text-lg">
            Create Album Now
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-20 md:mt-24 pt-10 md:pt-12 border-t border-subtle">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">📸</span>
                <span className="text-xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
                  Partifoto
                </span>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4">
                The easiest way to share and collect photos from your special moments.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                Your photos are encrypted and secure
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="#how-it-works" className="hover:text-violet-300 transition-colors">How it works</a></li>
                <li><Link href="/" className="hover:text-violet-300 transition-colors">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="#" className="hover:text-violet-300 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-violet-300 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-violet-300 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-violet-300 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-subtle text-center text-sm text-muted">
            <p>&copy; {new Date().getFullYear()} Partifoto. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
