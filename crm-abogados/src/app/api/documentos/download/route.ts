import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { documentos } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await requireUserId()
  if (!userId) return new NextResponse('No autorizado', { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL requerida', { status: 400 })

  // Verificar que el documento pertenece al usuario
  const [doc] = await db.select({ id: documentos.id, nombre: documentos.nombre })
    .from(documentos)
    .where(and(eq(documentos.archivo, url), eq(documentos.userId, userId)))

  if (!doc) return new NextResponse('No autorizado', { status: 403 })

  const blobRes = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  })

  if (!blobRes.ok) return new NextResponse('Error al obtener el archivo', { status: 502 })

  const contentType = blobRes.headers.get('Content-Type') || 'application/octet-stream'
  const ext = url.split('?')[0].split('.').pop() || ''
  const filename = `${doc.nombre}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_')

  return new NextResponse(blobRes.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
