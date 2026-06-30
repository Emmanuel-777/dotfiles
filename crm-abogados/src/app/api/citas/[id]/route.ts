import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { citas, clientes, causas, prospectos } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const rows = await db
    .select({ cita: citas, cliente: clientes, prospecto: prospectos, causa: causas })
    .from(citas)
    .leftJoin(clientes, eq(citas.clienteId, clientes.id))
    .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
    .leftJoin(causas, eq(citas.causaId, causas.id))
    .where(and(eq(citas.id, params.id), eq(citas.userId, userId)))
    .limit(1)

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  const allowed = ['titulo', 'descripcion', 'clienteId', 'prospectoId', 'causaId', 'fecha', 'horaInicio', 'horaFin', 'tipo', 'linkReunion', 'esGratuita', 'valor', 'estado', 'notas']

  for (const key of allowed) {
    if (key in body) {
      if (key === 'esGratuita') {
        updates[key] = body[key] ? 1 : 0
        if (body[key]) updates['valor'] = null
      } else if (key === 'valor') {
        updates[key] = body.esGratuita ? null : (body[key] ? Number(body[key]) : null)
      } else if (key === 'clienteId' || key === 'prospectoId' || key === 'causaId') {
        updates[key] = body[key] || null
      } else {
        updates[key] = body[key] ?? null
      }
    }
  }

  updates['updatedAt'] = new Date().toISOString()

  await db.update(citas).set(updates).where(and(eq(citas.id, params.id), eq(citas.userId, userId)))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(citas).where(and(eq(citas.id, params.id), eq(citas.userId, userId)))
  return NextResponse.json({ ok: true })
}
