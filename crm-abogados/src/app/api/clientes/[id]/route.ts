import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { clientes, causas, honorarios } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'
import { registrarAuditoria } from '@/lib/audit'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const clienteCausas = await db.select().from(causas).where(and(eq(causas.clienteId, params.id), eq(causas.userId, userId)))
  const clienteHonorarios = await db.select().from(honorarios).where(and(eq(honorarios.clienteId, params.id), eq(honorarios.userId, userId)))
  return NextResponse.json({ ...cliente, causas: clienteCausas, honorarios: clienteHonorarios })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  delete body.id
  delete body.userId
  body.updatedAt = new Date().toISOString()
  await db.update(clientes).set(body).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
  const [updated] = await db.select().from(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))

  await db.delete(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))

  await registrarAuditoria({
    userId,
    accion: 'DELETE_CLIENTE',
    entidad: 'cliente',
    entidadId: params.id,
    detalle: cliente ? `${cliente.nombre} (${cliente.rut})` : null,
  })

  return NextResponse.json({ ok: true })
}
