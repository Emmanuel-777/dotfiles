import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'

// Tipos MIME aceptados por Blob al subir. Incluye octet-stream porque algunos
// navegadores reportan .doc/.docx con MIME genérico; la extensión del pathname
// se valida aparte en onBeforeGenerateToken.
const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/x-pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/octet-stream',
]

const EXT_ALLOWED = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'])
const MAX_BYTES = 10 * 1024 * 1024

// Subida directa navegador → Vercel Blob (client upload). Esta ruta solo emite
// el token de subida tras autenticar al usuario y validar tipo/tamaño; el
// archivo NO pasa por la función, así se evita el límite de ~4,5 MB de Vercel.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const userId = await getUserId()
        if (!userId) throw new Error('No autorizado')

        const lower = pathname.toLowerCase()
        const dot = lower.lastIndexOf('.')
        const ext = dot !== -1 ? lower.slice(dot) : ''
        if (!EXT_ALLOWED.has(ext)) {
          throw new Error('Tipo de archivo no permitido. Use PDF, DOC, DOCX, JPG o PNG')
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al subir el archivo'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
