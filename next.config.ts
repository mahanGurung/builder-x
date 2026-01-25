import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.stamp.fyi',
        port: '',
        pathname: '**',
      },
    ],
  },
  experimental: { turbopack: true } as any, // cast entire object
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals ?? []
      config.externals.push('@prisma/client')
    }
    return config
  },
}

export default nextConfig
