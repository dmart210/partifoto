import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let remotePatterns: any = undefined;

try {
  if (supabaseUrl) {
    const host = new URL(supabaseUrl).hostname;
    remotePatterns = [
      {
        protocol: 'https',
        hostname: host,
        pathname: '/storage/v1/object/public/**',
      },
    ];
  }
} catch {
  // ignore invalid URL
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
