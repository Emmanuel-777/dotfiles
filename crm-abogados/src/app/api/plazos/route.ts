import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { plazos, causas, clientes } from '@/lib/schema'
import { eq, and, asc, lt } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export async function GET() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Auto-vencer plazos cuya fecha ya pasó
  const hoy = new Date().toISOString().split('T')[0]
  await db.update(plazos)
    .set({ estado: 'VENCIDO', updatedAt: new Date().toISOString() })
    .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), lt(plazos.fecha, hoy)))

  const rows = await db
    .select({ plazo: plazos, causa: causas, cliente: clientes })
    .from(plazos)
    .leftJoin(causas, eq(plazos.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(plazos.userId, userId))
    .orderBy(asc(plazos.fecha))
  return NextResponse.json(rows.map((r) => ({ ...r.plazo, causa: { ...r.causa, cliente: r.cliente } })))
}

export async function POST(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { titulo, fecha, tipo, notas, causaId } = body

  if (!titulo || !fecha || !causaId) {
    return NextResponse.json({ error: 'Título, fecha y causa son requeridos' }, { status: 400 })
  }

  const [causa] = await db.select().from(causas).where(and(eq(causas.id, causaId), eq(causas.userId, userId)))
  if (!causa) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(plazos).values({ id, userId, titulo, fecha, tipo: tipo || 'OTRO', notas, causaId, createdAt: now, updatedAt: now })
  const [plazo] = await db.select().from(plazos).where(and(eq(plazos.id, id), eq(plazos.userId, userId)))
  return NextResponse.json(plazo, { status: 201 })
}

export async function PUT(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { id, userId: _ui, ...data } = body
  data.updatedAt = new Date().toISOString()
  await db.update(plazos).set(data).where(and(eq(plazos.id, id), eq(plazos.userId, userId)))
  const [updated] = await db.select().from(plazos).where(and(eq(plazos.id, id), eq(plazos.userId, userId)))
  return NextResponse.json(updated)
}
