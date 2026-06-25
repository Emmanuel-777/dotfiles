import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { plazos, causas, clientes } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET() {
  await initDB()
  const rows = await db
    .select({ plazo: plazos, causa: causas, cliente: clientes })
    .from(plazos)
    .leftJoin(causas, eq(plazos.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .orderBy(asc(plazos.fecha))
  return NextResponse.json(rows.map((r) => ({ ...r.plazo, causa: { ...r.causa, cliente: r.cliente } })))
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()
  const { titulo, fecha, tipo, notas, causaId } = body

  if (!titulo || !fecha || !causaId) {
    return NextResponse.json({ error: 'Título, fecha y causa son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(plazos).values({ id, titulo, fecha, tipo: tipo || 'OTRO', notas, causaId, createdAt: now, updatedAt: now })
  const [plazo] = await db.select().from(plazos).where(eq(plazos.id, id))
  return NextResponse.json(plazo, { status: 201 })
}

export async function PUT(req: Request) {
  await initDB()
  const body = await req.json()
  const { id, ...data } = body
  data.updatedAt = new Date().toISOString()
  await db.update(plazos).set(data).where(eq(plazos.id, id))
  const [updated] = await db.select().from(plazos).where(eq(plazos.id, id))
  return NextResponse.json(updated)
}
