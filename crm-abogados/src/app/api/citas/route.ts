import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { citas, clientes, causas } from '@/lib/schema'
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
  const causaId = searchParams.get('causaId')

  const rows = await db
    .select({ cita: citas, cliente: clientes, causa: causas })
    .from(citas)
    .leftJoin(clientes, eq(citas.clienteId, clientes.id))
    .leftJoin(causas, eq(citas.causaId, causas.id))
    .where(eq(citas.userId, userId))
    .orderBy(desc(citas.fecha))

  let result = rows
  if (clienteId) result = result.filter((r) => r.cita.clienteId === clienteId)
  if (causaId) result = result.filter((r) => r.cita.causaId === causaId)

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const id = nanoid()

  const nueva = {
    id,
    userId,
    titulo: body.titulo,
    descripcion: body.descripcion ?? null,
    clienteId: body.clienteId || null,
    causaId: body.causaId || null,
    fecha: body.fecha,
    horaInicio: body.horaInicio,
    horaFin: body.horaFin ?? null,
    tipo: body.tipo ?? 'PRESENCIAL',
    linkReunion: body.linkReunion ?? null,
    esGratuita: body.esGratuita ? 1 : 0,
    valor: body.esGratuita ? null : (body.valor ? Number(body.valor) : null),
    estado: body.estado ?? 'PENDIENTE',
    notas: body.notas ?? null,
  }

  await db.insert(citas).values(nueva)
  return NextResponse.json({ id }, { status: 201 })
}
