import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
