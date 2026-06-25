import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { tareas } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const [tarea] = await db.select().from(tareas).where(eq(tareas.id, params.id))
  if (!tarea) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(tarea)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const body = await req.json()
  const { id: _id, createdAt: _ca, causaId: _ci, ...data } = body

  if (data.credencialesPortal && typeof data.credencialesPortal === 'object') {
    data.credencialesPortal = JSON.stringify(data.credencialesPortal)
  }
  if (typeof data.esDerivada === 'boolean') {
    data.esDerivada = data.esDerivada ? 1 : 0
  }

  await db.update(tareas)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(tareas.id, params.id))

  const [updated] = await db.select().from(tareas).where(eq(tareas.id, params.id))
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  await db.delete(tareas).where(eq(tareas.id, params.id))
  return NextResponse.json({ ok: true })
}
