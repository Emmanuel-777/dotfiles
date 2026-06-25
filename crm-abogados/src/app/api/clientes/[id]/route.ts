import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { clientes, causas, honorarios } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, params.id))
  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const clienteCausas = await db.select().from(causas).where(eq(causas.clienteId, params.id))
  const clienteHonorarios = await db.select().from(honorarios).where(eq(honorarios.clienteId, params.id))
  return NextResponse.json({ ...cliente, causas: clienteCausas, honorarios: clienteHonorarios })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const body = await req.json()
  delete body.id
  body.updatedAt = new Date().toISOString()
  await db.update(clientes).set(body).where(eq(clientes.id, params.id))
  const [updated] = await db.select().from(clientes).where(eq(clientes.id, params.id))
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  await db.delete(clientes).where(eq(clientes.id, params.id))
  return NextResponse.json({ ok: true })
}
