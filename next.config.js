/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Desabilitar telemetria para builds mais rápidos
  telemetry: false,
}

module.exports = nextConfig
