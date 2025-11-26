/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'via.placeholder.com', 'dummyimage.com', 'images.unsplash.com'],
    unoptimized: false,
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
