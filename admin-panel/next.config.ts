import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/telegram/:path*',
        destination: 'http://localhost:3000/telegram/:path*',
      },
    ];
  },
};

export default nextConfig;
