const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async headers() {
    return [
      {
        source: '/s/:code*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

