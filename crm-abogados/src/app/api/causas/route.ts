import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { causas, clientes } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')

  const rows = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(causas.userId, userId))
    .orderBy(desc(causas.createdAt))

  const filtered = clienteId ? rows.filter((r) => r.causa.clienteId === clienteId) : rows
  return NextResponse.json(filtered.map((r) => ({ ...r.causa, cliente: r.cliente })))
}

export async function POST(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { rol, tribunal, tipoCausa, materia, estado, fechaIngreso, contraparte, abogadoResponsable, descripcion, clienteId } = body

  if (!rol || !tribunal || !clienteId) {
    return NextResponse.json({ error: 'ROL, tribunal y cliente son requeridos' }, { status: 400 })
  }

  // Verificar que el cliente pertenece al usuario
  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, clienteId), eq(clientes.userId, userId)))
  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(causas).values({
    id,
    userId,
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
  const [causa] = await db.select().from(causas).where(and(eq(causas.id, id), eq(causas.userId, userId)))
  return NextResponse.json(causa, { status: 201 })
}
