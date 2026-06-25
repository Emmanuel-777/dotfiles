import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { causas, clientes, actuaciones, plazos, documentos, honorarios } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const [causa] = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(causas.id, params.id))

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
  const body = await req.json()
  delete body.id
  body.updatedAt = new Date().toISOString()
  await db.update(causas).set(body).where(eq(causas.id, params.id))
  const [updated] = await db.select().from(causas).where(eq(causas.id, params.id))
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  await db.delete(causas).where(eq(causas.id, params.id))
  return NextResponse.json({ ok: true })
}
