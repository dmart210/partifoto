"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import AvatarMenu from "./ui/AvatarMenu";
import { usePathname } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  
  return (
    <html lang="en">
      <head>
        {/* Remove favicon by overriding with empty data URI */}
        <link rel="icon" href="data:," />
        <title>Partifoto</title>
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Sticky header with branding */}
        <header className="sticky top-0 z-50 pointer-events-none">
          <div className="flex justify-center pt-4 md:pt-6">
            <div className="pointer-events-auto">
              <a href="/" className="block glass-strong px-6 py-3 rounded-full border border-subtle hover:border-violet-500/50 transition-all camera-flash relative overflow-visible">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📸</span>
                  <span className="text-xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
                    Partifoto
                  </span>
                </div>
              </a>
            </div>
          </div>
        </header>
        
        {/* Global overlay container - only show AvatarMenu if not on landing page */}
        {!isLandingPage && (
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483647 }}>
            <div className="absolute top-4 right-4 md:top-6 md:left-6 md:right-auto pointer-events-auto">
              <AvatarMenu />
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
