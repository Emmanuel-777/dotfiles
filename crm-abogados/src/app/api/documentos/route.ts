import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { documentos, causas, clientes } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET() {
  await initDB()
  const rows = await db
    .select({ documento: documentos, causa: causas, cliente: clientes })
    .from(documentos)
    .leftJoin(causas, eq(documentos.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .orderBy(desc(documentos.createdAt))
  return NextResponse.json(rows.map((r) => ({ ...r.documento, causa: { ...r.causa, cliente: r.cliente } })))
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()
  const { nombre, tipo, descripcion, causaId } = body

  if (!nombre || !causaId) {
    return NextResponse.json({ error: 'Nombre y causa son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(documentos).values({ id, nombre, tipo: tipo || 'OTRO', descripcion, causaId, createdAt: now })
  const [doc] = await db.select().from(documentos).where(eq(documentos.id, id))
  return NextResponse.json(doc, { status: 201 })
}
