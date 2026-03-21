import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable the default Next.js server — we use a custom server.js
  // This tells Next.js to NOT start its own HTTP listener
  experimental: {},
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
