/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'via.placeholder.com', 'dummyimage.com', 'images.unsplash.com', 'picsum.photos', 'dompivovar.ru'],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'dompivovar.ru',
      },
      {
        protocol: 'http',
        hostname: 'dompivovar.ru',
      },
    ],
  },
  // Увеличиваем лимиты для больших файлов (для Server Actions)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig
