import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { tareas, causas, clientes } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const causaId = searchParams.get('causaId')
  const clienteId = searchParams.get('clienteId')
  const derivadas = searchParams.get('derivadas')

  let rows
  if (causaId) {
    rows = await db.select().from(tareas).where(and(eq(tareas.causaId, causaId), eq(tareas.userId, userId)))
  } else if (clienteId) {
    rows = await db.select().from(tareas).where(and(eq(tareas.clienteId, clienteId), eq(tareas.userId, userId)))
  } else if (derivadas === '1') {
    rows = await db.select().from(tareas).where(and(eq(tareas.esDerivada, 1), eq(tareas.userId, userId)))
  } else {
    rows = await db.select().from(tareas).where(eq(tareas.userId, userId))
  }
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()

  let clienteId = body.clienteId ?? null

  if (body.causaId) {
    const [causa] = await db.select().from(causas).where(and(eq(causas.id, body.causaId), eq(causas.userId, userId)))
    if (!causa) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })
    if (!clienteId) clienteId = causa.clienteId
  }

  if (!clienteId) return NextResponse.json({ error: 'Se requiere clienteId o causaId' }, { status: 400 })

  const [cliente] = await db.select({ id: clientes.id }).from(clientes).where(and(eq(clientes.id, clienteId), eq(clientes.userId, userId)))
  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  if (body.credencialesPortal && typeof body.credencialesPortal === 'object') {
    body.credencialesPortal = JSON.stringify(body.credencialesPortal)
  }
  if (typeof body.esDerivada === 'boolean') {
    body.esDerivada = body.esDerivada ? 1 : 0
  }

  const id = nanoid()
  await db.insert(tareas).values({ ...body, id, userId, clienteId, causaId: body.causaId ?? null })
  const [row] = await db.select().from(tareas).where(and(eq(tareas.id, id), eq(tareas.userId, userId)))
  return NextResponse.json(row, { status: 201 })
}
