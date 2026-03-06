/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@iziresto/ui', '@iziresto/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.iziresto.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-0f9fb6f1c6214ff49aaca83c116350ae.r2.dev',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:4000 https://localhost:4000 ws://localhost:* wss://localhost:*; frame-src 'self' http://localhost:4000 https://www.google.com https://maps.google.com;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
