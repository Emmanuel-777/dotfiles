import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { cuotasHonorario, honorarios, tareas } from '@/lib/schema'
import { eq, and, asc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const honorarioId = searchParams.get('honorarioId')
  if (!honorarioId) return NextResponse.json({ error: 'honorarioId es requerido' }, { status: 400 })

  const rows = await db.select().from(cuotasHonorario)
    .where(and(eq(cuotasHonorario.honorarioId, honorarioId), eq(cuotasHonorario.userId, userId)))
    .orderBy(asc(cuotasHonorario.fechaPago))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { honorarioId, monto, fechaPago } = body

  if (!honorarioId || !monto || !fechaPago) {
    return NextResponse.json({ error: 'honorarioId, monto y fechaPago son requeridos' }, { status: 400 })
  }

  const [honorario] = await db.select().from(honorarios).where(and(eq(honorarios.id, honorarioId), eq(honorarios.userId, userId)))
  if (!honorario) return NextResponse.json({ error: 'Honorario no encontrado' }, { status: 404 })

  const tareaId = nanoid()
  await db.insert(tareas).values({
    id: tareaId,
    userId,
    titulo: `Cobrar cuota — ${honorario.descripcion}`,
    descripcion: `Cuota comprometida de $${Number(monto).toLocaleString('es-CL')} del honorario "${honorario.descripcion}".`,
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    fechaVencimiento: new Date(fechaPago).toISOString(),
    clienteId: honorario.clienteId,
    causaId: honorario.causaId,
  })

  const id = nanoid()
  await db.insert(cuotasHonorario).values({
    id,
    userId,
    honorarioId,
    monto: Number(monto),
    fechaPago,
    tareaId,
  })

  const [cuota] = await db.select().from(cuotasHonorario).where(eq(cuotasHonorario.id, id))
  return NextResponse.json(cuota, { status: 201 })
}
