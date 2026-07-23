import { upload } from '@vercel/blob/client'

/**
 * Sube un documento directamente del navegador a Vercel Blob (acceso privado),
 * sin pasar por la función serverless. Esto evita el límite de ~4,5 MB del
 * cuerpo de las funciones de Vercel y permite archivos de hasta 10 MB.
 *
 * El endpoint /api/documentos/upload (handleUpload) autentica al usuario y
 * valida tipo/tamaño antes de emitir el token de subida.
 *
 * Devuelve la URL del blob para guardarla en la base de datos.
 */
export async function subirDocumento(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const pathname = `documentos/${Date.now()}_${safeName}`
  const blob = await upload(pathname, file, {
    access: 'private',
    handleUploadUrl: '/api/documentos/upload',
  })
  return blob.url
}
