import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { actuaciones, causas } from '@/lib/schema'
import { eq, and, asc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const causaId = searchParams.get('causaId')

  const rows = causaId
    ? await db.select().from(actuaciones).where(and(eq(actuaciones.causaId, causaId), eq(actuaciones.userId, userId))).orderBy(asc(actuaciones.fecha))
    : await db.select().from(actuaciones).where(eq(actuaciones.userId, userId)).orderBy(asc(actuaciones.fecha))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { fecha, tipo, descripcion, resultado, causaId } = body

  if (!descripcion || !causaId) {
    return NextResponse.json({ error: 'Descripción y causa son requeridos' }, { status: 400 })
  }

  // Verificar que la causa pertenece al usuario
  const [causa] = await db.select().from(causas).where(and(eq(causas.id, causaId), eq(causas.userId, userId)))
  if (!causa) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(actuaciones).values({
    id,
    userId,
    fecha: fecha || now,
    tipo: tipo || 'OTRO',
    descripcion,
    resultado: resultado || null,
    compromiso: body.compromiso || null,
    fechaRecordatorio: body.fechaRecordatorio || null,
    recordatorioEnviado: 0,
    archivoUrl: body.archivoUrl || null,
    archivoNombre: body.archivoNombre || null,
    causaId,
    createdAt: now,
  })
  const [act] = await db.select().from(actuaciones).where(and(eq(actuaciones.id, id), eq(actuaciones.userId, userId)))
  return NextResponse.json(act, { status: 201 })
}
