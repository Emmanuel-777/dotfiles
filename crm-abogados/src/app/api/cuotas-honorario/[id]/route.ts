import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { cuotasHonorario, tareas } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()

  const [cuota] = await db.select().from(cuotasHonorario).where(and(eq(cuotasHonorario.id, params.id), eq(cuotasHonorario.userId, userId)))
  if (!cuota) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  if ('pagada' in body) {
    const pagada = body.pagada ? 1 : 0
    await db.update(cuotasHonorario).set({ pagada }).where(eq(cuotasHonorario.id, params.id))
    if (cuota.tareaId) {
      await db.update(tareas).set({ estado: pagada ? 'COMPLETADA' : 'PENDIENTE' }).where(eq(tareas.id, cuota.tareaId))
    }
  }

  if ('monto' in body || 'fechaPago' in body) {
    const updates: { monto?: number; fechaPago?: string } = {}
    if ('monto' in body) updates.monto = Number(body.monto)
    if ('fechaPago' in body) updates.fechaPago = body.fechaPago
    await db.update(cuotasHonorario).set(updates).where(eq(cuotasHonorario.id, params.id))
    if (cuota.tareaId && updates.fechaPago) {
      await db.update(tareas).set({ fechaVencimiento: new Date(updates.fechaPago).toISOString() }).where(eq(tareas.id, cuota.tareaId))
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [cuota] = await db.select().from(cuotasHonorario).where(and(eq(cuotasHonorario.id, params.id), eq(cuotasHonorario.userId, userId)))
  if (!cuota) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  await db.delete(cuotasHonorario).where(eq(cuotasHonorario.id, params.id))
  if (cuota.tareaId) {
    await db.delete(tareas).where(eq(tareas.id, cuota.tareaId))
  }

  return NextResponse.json({ ok: true })
}
