import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { tareas, causas } from '@/lib/schema'
import { eq, asc, desc, and, ne } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET(req: NextRequest) {
  await initDB()
  const causaId = req.nextUrl.searchParams.get('causaId')
  const derivadas = req.nextUrl.searchParams.get('derivadas')

  if (causaId) {
    const rows = await db
      .select()
      .from(tareas)
      .where(eq(tareas.causaId, causaId))
      .orderBy(asc(tareas.fechaVencimiento))
    return NextResponse.json(rows)
  }

  if (derivadas === '1') {
    const rows = await db
      .select({ tarea: tareas, causa: causas })
      .from(tareas)
      .leftJoin(causas, eq(tareas.causaId, causas.id))
      .where(and(eq(tareas.esDerivada, 1), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA')))
      .orderBy(asc(tareas.fechaVencimiento))
    return NextResponse.json(rows.map((r) => ({ ...r.tarea, causa: r.causa })))
  }

  const rows = await db.select().from(tareas).orderBy(desc(tareas.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()
  const { titulo, descripcion, estado, prioridad, fechaVencimiento, asignadoA, asignadoEmail, esDerivada, credencialesPortal, notas, causaId } = body

  if (!titulo || !causaId) {
    return NextResponse.json({ error: 'titulo y causaId son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(tareas).values({
    id,
    titulo,
    descripcion: descripcion || null,
    estado: estado || 'PENDIENTE',
    prioridad: prioridad || 'MEDIA',
    fechaVencimiento: fechaVencimiento || null,
    asignadoA: asignadoA || null,
    asignadoEmail: asignadoEmail || null,
    esDerivada: esDerivada ? 1 : 0,
    credencialesPortal: credencialesPortal ? JSON.stringify(credencialesPortal) : null,
    notas: notas || null,
    causaId,
    createdAt: now,
    updatedAt: now,
  })
  const [tarea] = await db.select().from(tareas).where(eq(tareas.id, id))
  return NextResponse.json(tarea, { status: 201 })
}
