import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { causas, clientes, actuaciones, plazos, documentos, honorarios } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [causa] = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(and(eq(causas.id, params.id), eq(causas.userId, userId)))

  if (!causa) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const [acts, pls, docs, hons] = await Promise.all([
    db.select().from(actuaciones).where(eq(actuaciones.causaId, params.id)),
    db.select().from(plazos).where(eq(plazos.causaId, params.id)),
    db.select().from(documentos).where(eq(documentos.causaId, params.id)),
    db.select().from(honorarios).where(eq(honorarios.causaId, params.id)),
  ])

  return NextResponse.json({
    ...causa.causa,
    cliente: causa.cliente,
    actuaciones: acts,
    plazos: pls,
    documentos: docs,
    honorarios: hons,
  })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  delete body.id
  delete body.userId
  body.updatedAt = new Date().toISOString()
  await db.update(causas).set(body).where(and(eq(causas.id, params.id), eq(causas.userId, userId)))
  const [updated] = await db.select().from(causas).where(and(eq(causas.id, params.id), eq(causas.userId, userId)))
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(causas).where(and(eq(causas.id, params.id), eq(causas.userId, userId)))
  return NextResponse.json({ ok: true })
}
