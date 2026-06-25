import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { tareas } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET(req: NextRequest) {
  await initDB()
  const { searchParams } = new URL(req.url)
  const causaId = searchParams.get('causaId')
  const derivadas = searchParams.get('derivadas')

  let rows
  if (causaId) {
    rows = await db.select().from(tareas).where(eq(tareas.causaId, causaId))
  } else if (derivadas === '1') {
    rows = await db.select().from(tareas).where(eq(tareas.esDerivada, 1))
  } else {
    rows = await db.select().from(tareas)
  }
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()

  if (body.credencialesPortal && typeof body.credencialesPortal === 'object') {
    body.credencialesPortal = JSON.stringify(body.credencialesPortal)
  }
  if (typeof body.esDerivada === 'boolean') {
    body.esDerivada = body.esDerivada ? 1 : 0
  }

  const id = nanoid()
  await db.insert(tareas).values({ ...body, id })
  const [row] = await db.select().from(tareas).where(eq(tareas.id, id))
  return NextResponse.json(row, { status: 201 })
}
