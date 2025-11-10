import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AvatarMenu from "./ui/AvatarMenu";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Partifoto – Share Event Photos Instantly",
  description: "Partifoto lets anyone with the link upload, comment on, and download event photos in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Remove favicon by overriding with empty data URI */}
        <link rel="icon" href="data:," />
        <title>Partifoto</title>
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Global overlay container to avoid clipping and ensure clicks only on the avatar */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483647 }}>
          <div className="absolute top-4 left-4 pointer-events-auto">
            <AvatarMenu />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
