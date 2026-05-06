/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin
  } catch {
    return 'http://localhost:4000'
  }
})()
const wsOrigin = apiOrigin.replace(/^http/, 'ws')

const r2PublicHost = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : 'pub-0f9fb6f1c6214ff49aaca83c116350ae.r2.dev'
  } catch {
    return 'pub-0f9fb6f1c6214ff49aaca83c116350ae.r2.dev'
  }
})()

const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST || 'cdn.iziresto.com'

const connectSrc = [
  "'self'",
  apiOrigin,
  wsOrigin,
  'http://localhost:*',
  'https://localhost:*',
  'ws://localhost:*',
  'wss://localhost:*',
].join(' ')

const frameSrc = [
  "'self'",
  apiOrigin,
  'https://www.google.com',
  'https://maps.google.com',
].join(' ')

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src ${connectSrc}`,
  `frame-src ${frameSrc}`,
].join('; ')

const nextConfig = {
  transpilePackages: ['@iziresto/ui', '@iziresto/shared'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: cdnHost },
      { protocol: 'https', hostname: r2PublicHost },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy', value: csp }],
      },
    ]
  },
}

module.exports = nextConfig
