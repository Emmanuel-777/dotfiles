import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'

// Respaldo de subida por el servidor. Se usa cuando la subida directa a Blob
// (client upload) no está disponible en el entorno. El archivo pasa por la
// función, así que está limitado a ~4,5 MB por Vercel; ponemos un tope de 4 MB.
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/x-pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
}

const EXT_ALLOWED: Record<string, string> = {
  '.pdf': '.pdf', '.doc': '.doc', '.docx': '.docx',
  '.jpg': '.jpg', '.jpeg': '.jpg', '.png': '.png',
}

const MAX_BYTES = 4 * 1024 * 1024

function resolveExt(file: File): string | null {
  if (ALLOWED_TYPES[file.type]) return ALLOWED_TYPES[file.type]
  const lower = file.name.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot !== -1) {
    const ext = lower.slice(dot)
    if (EXT_ALLOWED[ext]) return EXT_ALLOWED[ext]
  }
  return null
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el límite de 4 MB de la subida por el servidor' }, { status: 400 })
    }

    const ext = resolveExt(file)
    if (!ext) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido (${file.type || 'desconocido'}). Use PDF, DOC, DOCX, JPG o PNG` },
        { status: 400 },
      )
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '') + ext
    const pathname = `documentos/${userId}/${Date.now()}_${safeName}`

    const blob = await put(pathname, file, { access: 'private', addRandomSuffix: true })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al subir el archivo: ${msg}` }, { status: 500 })
  }
}
