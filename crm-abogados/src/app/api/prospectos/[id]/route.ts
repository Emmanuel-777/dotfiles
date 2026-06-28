import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { prospectos } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [row] = await db.select().from(prospectos).where(and(eq(prospectos.id, params.id), eq(prospectos.userId, userId)))
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  delete body.id
  delete body.userId
  delete body.clienteId
  if (body.valorEstimado !== undefined) body.valorEstimado = body.valorEstimado ? Number(body.valorEstimado) : null
  if (body.proximoContacto !== undefined) body.proximoContacto = body.proximoContacto || null
  body.updatedAt = new Date().toISOString()
  await db.update(prospectos).set(body).where(and(eq(prospectos.id, params.id), eq(prospectos.userId, userId)))
  const [updated] = await db.select().from(prospectos).where(and(eq(prospectos.id, params.id), eq(prospectos.userId, userId)))
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(prospectos).where(and(eq(prospectos.id, params.id), eq(prospectos.userId, userId)))
  return NextResponse.json({ ok: true })
}
