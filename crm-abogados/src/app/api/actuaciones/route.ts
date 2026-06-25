import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { actuaciones } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function POST(req: Request) {
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
    resultado,
    causaId,
    createdAt: now,
  })
  const [act] = await db.select().from(actuaciones).where(eq(actuaciones.id, id))
  return NextResponse.json(act, { status: 201 })
}
