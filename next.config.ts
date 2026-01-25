import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Empty Turbopack config to silence the warning
  turbopack: {},
  
  serverExternalPackages: ['ses', '@stacks/encryption'],
};

export default nextConfig;