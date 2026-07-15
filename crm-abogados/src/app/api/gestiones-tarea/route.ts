import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { gestionesTarea, tareas } from '@/lib/schema'
import { eq, and, asc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const tareaId = searchParams.get('tareaId')
  if (!tareaId) return NextResponse.json({ error: 'tareaId es requerido' }, { status: 400 })

  const rows = await db.select().from(gestionesTarea)
    .where(and(eq(gestionesTarea.tareaId, tareaId), eq(gestionesTarea.userId, userId)))
    .orderBy(asc(gestionesTarea.fecha))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { tareaId, descripcion, fecha } = body

  if (!tareaId || !descripcion) {
    return NextResponse.json({ error: 'Tarea y descripción son requeridos' }, { status: 400 })
  }

  const [tarea] = await db.select({ id: tareas.id }).from(tareas).where(and(eq(tareas.id, tareaId), eq(tareas.userId, userId)))
  if (!tarea) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(gestionesTarea).values({
    id,
    userId,
    tareaId,
    fecha: fecha || now,
    descripcion,
    createdAt: now,
  })
  const [gestion] = await db.select().from(gestionesTarea).where(eq(gestionesTarea.id, id))
  return NextResponse.json(gestion, { status: 201 })
}
