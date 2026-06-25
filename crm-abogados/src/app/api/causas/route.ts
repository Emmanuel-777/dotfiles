import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { causas, clientes } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET() {
  await initDB()
  const rows = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .orderBy(desc(causas.createdAt))
  return NextResponse.json(rows.map((r) => ({ ...r.causa, cliente: r.cliente })))
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()
  const { rol, tribunal, tipoCausa, materia, estado, fechaIngreso, contraparte, abogadoResponsable, descripcion, clienteId } = body

  if (!rol || !tribunal || !clienteId) {
    return NextResponse.json({ error: 'ROL, tribunal y cliente son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(causas).values({
    id,
    rol,
    tribunal,
    tipoCausa: tipoCausa || 'Civil',
    materia,
    estado: estado || 'EN_TRAMITE',
    fechaIngreso: fechaIngreso || now,
    contraparte,
    abogadoResponsable,
    descripcion,
    clienteId,
    createdAt: now,
    updatedAt: now,
  })
  const [causa] = await db.select().from(causas).where(eq(causas.id, id))
  return NextResponse.json(causa, { status: 201 })
}
