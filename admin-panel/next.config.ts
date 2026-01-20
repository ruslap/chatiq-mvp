import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  async rewrites() {
    return [
      {
        // Proxy all /api/* except /api/auth/* (handled by NextAuth)
        source: '/api/:path((?!auth/).*)',
        destination: 'http://api-server:3000/:path*',
      },
    ];
  },
};

export default nextConfig;
