const path = require('path')

/** @type {import('next').NextConfig} */
// Cabeceras de seguridad para todas las rutas. No se define Content-Security-Policy
// a propósito: Clerk y los scripts de terceros exigen una política afinada que
// conviene probar primero en modo "Report-Only" para no romper el ingreso.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
]

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  experimental: {
    serverComponentsExternalPackages: ['@vercel/blob'],
  },
  webpack: (config) => {
    // @vercel/blob/client importa `fetch` desde undici (Node). En el bundle del
    // navegador undici no funciona ni webpack lo puede parsear; lo reemplazamos
    // por un shim sobre el fetch global (disponible en el navegador y en Node 18+).
    // La clave exacta `undici$` intercepta solo el import bare, no sus subrutas.
    config.resolve.alias = {
      ...config.resolve.alias,
      undici$: path.resolve(__dirname, 'src/lib/undici-browser-shim.js'),
    }
    return config
  },
}

module.exports = nextConfig
