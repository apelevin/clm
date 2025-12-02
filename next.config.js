/** @type {import('next').NextConfig} */
const nextConfig = {
  // Увеличиваем лимит размера заголовков для больших запросов
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Увеличиваем лимит размера тела запроса
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
    responseLimit: '8mb',
  },
}

module.exports = nextConfig

