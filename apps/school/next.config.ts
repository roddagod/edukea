import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@edukea/shared'],
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
