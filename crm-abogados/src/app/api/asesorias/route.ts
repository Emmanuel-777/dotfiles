import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { asesorias, clientes } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')

  const rows = clienteId
    ? await db.select().from(asesorias).where(and(eq(asesorias.clienteId, clienteId), eq(asesorias.userId, userId))).orderBy(desc(asesorias.fecha))
    : await db.select().from(asesorias).where(eq(asesorias.userId, userId)).orderBy(desc(asesorias.fecha))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { fecha, tipo, descripcion, clienteId, causaId, archivoUrl, archivoNombre } = body

  if (!descripcion || !clienteId) {
    return NextResponse.json({ error: 'Descripción y cliente son requeridos' }, { status: 400 })
  }

  // Verificar que el cliente pertenece al usuario
  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, clienteId), eq(clientes.userId, userId)))
  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(asesorias).values({
    id,
    userId,
    clienteId,
    causaId: causaId || null,
    fecha: fecha || now,
    tipo: tipo || 'Consulta general',
    descripcion,
    archivoUrl: archivoUrl || null,
    archivoNombre: archivoNombre || null,
    createdAt: now,
  })
  const [asesoria] = await db.select().from(asesorias).where(and(eq(asesorias.id, id), eq(asesorias.userId, userId)))
  return NextResponse.json(asesoria, { status: 201 })
}
