import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  images: {
    formats: ['image/avif', 'image/webp'],
  }
};

export default nextConfig;
