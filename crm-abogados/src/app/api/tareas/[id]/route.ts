import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { tareas } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [tarea] = await db.select().from(tareas).where(and(eq(tareas.id, params.id), eq(tareas.userId, userId)))
  if (!tarea) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(tarea)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { id: _id, createdAt: _ca, causaId: _ci, userId: _ui, ...data } = body

  if (data.credencialesPortal && typeof data.credencialesPortal === 'object') {
    data.credencialesPortal = encrypt(JSON.stringify(data.credencialesPortal))
  }
  if (typeof data.esDerivada === 'boolean') {
    data.esDerivada = data.esDerivada ? 1 : 0
  }

  await db.update(tareas)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(tareas.id, params.id), eq(tareas.userId, userId)))

  const [updated] = await db.select().from(tareas).where(and(eq(tareas.id, params.id), eq(tareas.userId, userId)))
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(tareas).where(and(eq(tareas.id, params.id), eq(tareas.userId, userId)))
  return NextResponse.json({ ok: true })
}
