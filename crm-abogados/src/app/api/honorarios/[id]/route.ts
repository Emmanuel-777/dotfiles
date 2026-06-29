import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { honorarios } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [hon] = await db.select().from(honorarios).where(and(eq(honorarios.id, params.id), eq(honorarios.userId, userId)))
  if (!hon) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(hon)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [hon] = await db.select().from(honorarios).where(and(eq(honorarios.id, params.id), eq(honorarios.userId, userId)))
  if (!hon) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await req.json()
  const { descripcion, monto, tipo, estado, fechaEmision, fechaVence, fechaPago, notas, causaId } = body

  await db.update(honorarios).set({
    descripcion: descripcion ?? hon.descripcion,
    monto: monto != null ? parseFloat(monto) : hon.monto,
    tipo: tipo ?? hon.tipo,
    estado: estado ?? hon.estado,
    fechaEmision: fechaEmision ?? hon.fechaEmision,
    fechaVence: fechaVence !== undefined ? (fechaVence || null) : hon.fechaVence,
    fechaPago: fechaPago !== undefined ? (fechaPago || null) : hon.fechaPago,
    notas: notas !== undefined ? notas : hon.notas,
    causaId: causaId !== undefined ? (causaId || null) : hon.causaId,
    updatedAt: new Date().toISOString(),
  }).where(and(eq(honorarios.id, params.id), eq(honorarios.userId, userId)))

  const [updated] = await db.select().from(honorarios).where(eq(honorarios.id, params.id))
  return NextResponse.json(updated)
}
