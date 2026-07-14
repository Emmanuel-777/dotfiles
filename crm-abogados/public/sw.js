self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Pass-through: LexCRM sirve datos en vivo, no se cachea nada.
  // Este service worker existe solo para que el navegador considere
  // la app instalable (requisito técnico de PWA).
})
