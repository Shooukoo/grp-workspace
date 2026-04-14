import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['privacy-pic-stayed-educational.trycloudflare.com'],

  images: {
    remotePatterns: [
      // Cloudflare R2 public buckets (*.r2.dev)
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      // Custom domain if configured via NEXT_PUBLIC_R2_PUBLIC_URL
      ...(process.env.NEXT_PUBLIC_R2_PUBLIC_URL
        ? [{
            protocol: 'https' as const,
            hostname: new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname,
          }]
        : []),
    ],
  },
};

export default nextConfig;

