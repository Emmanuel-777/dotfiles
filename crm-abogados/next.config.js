const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
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
