import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { documentos, causas, clientes } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export async function GET() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const rows = await db
    .select({ documento: documentos, causa: causas, cliente: clientes })
    .from(documentos)
    .leftJoin(causas, eq(documentos.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(documentos.userId, userId))
    .orderBy(desc(documentos.createdAt))
  return NextResponse.json(rows.map((r) => ({ ...r.documento, causa: { ...r.causa, cliente: r.cliente } })))
}

export async function POST(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { nombre, tipo, descripcion, causaId, archivo } = body

  if (!nombre || !causaId) {
    return NextResponse.json({ error: 'Nombre y causa son requeridos' }, { status: 400 })
  }

  const [causa] = await db.select().from(causas).where(and(eq(causas.id, causaId), eq(causas.userId, userId)))
  if (!causa) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(documentos).values({ id, userId, nombre, tipo: tipo || 'OTRO', descripcion, causaId, archivo: archivo || null, createdAt: now })
  const [doc] = await db.select().from(documentos).where(and(eq(documentos.id, id), eq(documentos.userId, userId)))
  return NextResponse.json(doc, { status: 201 })
}
