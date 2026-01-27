import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['viem', 'wagmi'],
  serverExternalPackages: [
    'ses',
    '@stacks/encryption',
    '@stacks/connect',
    '@stacks/connect-ui',
    '@stacks/transactions',
    '@stacks/network',
    '@stacks/common',
    '@stacks/profile',
    // Older/alternate package names that can appear in compiled bundles
    '@stacks/transactions-v6',
    '@stacks/network-v6',
    '@stacks/connect-ui/dist',
    // Prisma packages - REQUIRED to prevent client-side bundling
    '@prisma/client',
    '@prisma/adapter-pg',
    '@prisma/adapter-better-sqlite3',
    '@prisma/client-runtime-utils',
    '@prisma/engine-core',
    'prisma',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  }
};

export default nextConfig;