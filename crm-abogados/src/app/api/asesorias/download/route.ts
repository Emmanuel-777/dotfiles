import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { asesorias } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await requireUserId()
  if (!userId) return new NextResponse('No autorizado', { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL requerida', { status: 400 })

  // Verificar que el archivo pertenece a un registro de asesoría del usuario
  const [asesoria] = await db.select({ id: asesorias.id, archivoNombre: asesorias.archivoNombre })
    .from(asesorias)
    .where(and(eq(asesorias.archivoUrl, url), eq(asesorias.userId, userId)))

  if (!asesoria) return new NextResponse('No autorizado', { status: 403 })

  const blobRes = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  })

  if (!blobRes.ok) return new NextResponse('Error al obtener el archivo', { status: 502 })

  const contentType = blobRes.headers.get('Content-Type') || 'application/octet-stream'
  const ext = url.split('?')[0].split('.').pop() || ''
  const filename = `${asesoria.archivoNombre || 'documento'}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_')

  return new NextResponse(blobRes.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
