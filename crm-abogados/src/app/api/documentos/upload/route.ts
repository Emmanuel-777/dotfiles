import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el límite de 10 MB' }, { status: 400 })
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Use PDF, DOC, DOCX, JPG o PNG' }, { status: 400 })
  }

  const ext = ALLOWED_TYPES[file.type]
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '') + ext
  const pathname = `documentos/${userId}/${Date.now()}_${safeName}`

  const blob = await put(pathname, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
