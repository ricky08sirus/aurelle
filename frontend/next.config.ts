import type { NextConfig } from "next";

// Same value as R2_PUBLIC_BASE_URL in backend/.env
const r2PublicUrl = process.env.R2_PUBLIC_BASE_URL;

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // Serve modern formats: much smaller than PNG/JPEG at the same quality
    formats: ["image/avif", "image/webp"],
    // Allow next/image to load product photos from the R2 bucket
    remotePatterns: r2PublicUrl
      ? [
          {
            protocol: "https",
            hostname: new URL(r2PublicUrl).hostname,
            pathname: "/images/**",
          },
        ]
      : [],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;