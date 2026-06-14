// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PWA: Using next-pwa with webpack mode
  // Run with: next build --webpack (or set output: 'standalone')
};

export default nextConfig;
