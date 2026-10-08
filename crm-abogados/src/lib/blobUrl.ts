/**
 * Los archivos viven en Vercel Blob. Las rutas de descarga reenvían el token
 * privado (BLOB_READ_WRITE_TOKEN) al hacer fetch(url), así que una URL que no
 * sea de Blob filtraría ese token a un servidor ajeno (y permitiría SSRF).
 * Toda URL de archivo se valida con esto, tanto al guardarla como al descargarla.
 */
export function esUrlBlobPropia(valor: unknown): valor is string {
  if (typeof valor !== 'string' || valor.length > 2048) return false
  let u: URL
  try {
    u = new URL(valor)
  } catch {
    return false
  }
  return (
    u.protocol === 'https:' &&
    !u.username && !u.password &&
    (u.port === '' || u.port === '443') &&
    u.hostname.toLowerCase().endsWith('.blob.vercel-storage.com')
  )
}

/** Para campos opcionales: null/'' pasan; cualquier otra cosa debe ser URL de Blob. */
export function urlArchivoValida(valor: unknown): boolean {
  return valor === undefined || valor === null || valor === '' || esUrlBlobPropia(valor)
}
