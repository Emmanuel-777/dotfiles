import { upload } from '@vercel/blob/client'

const FALLBACK_MAX = 4 * 1024 * 1024

/**
 * Sube un documento y devuelve la URL del blob (acceso privado).
 *
 * 1) Intenta la subida directa navegador → Vercel Blob (client upload), que
 *    evita el límite de ~4,5 MB de las funciones y permite hasta 10 MB.
 * 2) Si esa vía no está disponible en el entorno (por ejemplo, si la subida
 *    directa falla al emitir el token), cae a una subida por el servidor para
 *    archivos que caben en el límite de la función (≤ 4 MB). Así los documentos
 *    normales suben igual aunque la subida directa no esté disponible.
 */
export async function subirDocumento(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const pathname = `documentos/${Date.now()}_${safeName}`

  try {
    const blob = await upload(pathname, file, {
      access: 'private',
      handleUploadUrl: '/api/documentos/upload',
    })
    return blob.url
  } catch (directErr) {
    // Respaldo por el servidor (limitado por Vercel a ~4,5 MB).
    if (file.size > FALLBACK_MAX) {
      throw directErr instanceof Error
        ? directErr
        : new Error('No se pudo subir el archivo')
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/documentos/upload-fallback', { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Error al subir el archivo')
    }
    const { url } = await res.json()
    return url
  }
}
