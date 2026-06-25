import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { actuaciones } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const causaId = searchParams.get('causaId')

  const rows = causaId
    ? await db.select().from(actuaciones).where(eq(actuaciones.causaId, causaId)).orderBy(asc(actuaciones.fecha))
    : await db.select().from(actuaciones).orderBy(asc(actuaciones.fecha))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const body = await req.json()
  const { fecha, tipo, descripcion, resultado, causaId } = body

  if (!descripcion || !causaId) {
    return NextResponse.json({ error: 'Descripción y causa son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(actuaciones).values({
    id,
    fecha: fecha || now,
    tipo: tipo || 'OTRO',
    descripcion,
    resultado: resultado || null,
    causaId,
    createdAt: now,
  })
  const [act] = await db.select().from(actuaciones).where(eq(actuaciones.id, id))
  return NextResponse.json(act, { status: 201 })
}
