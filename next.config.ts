import { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
