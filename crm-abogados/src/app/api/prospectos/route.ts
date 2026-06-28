import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { prospectos } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export async function GET() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const rows = await db.select().from(prospectos).where(eq(prospectos.userId, userId)).orderBy(desc(prospectos.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { nombre, empresa, email, telefono, origen, etapa, valorEstimado, notas, fechaContacto, proximoContacto } = body

  if (!nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (!fechaContacto) return NextResponse.json({ error: 'La fecha de contacto es requerida' }, { status: 400 })

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(prospectos).values({
    id, userId, nombre, empresa, email, telefono,
    origen: origen || 'REFERIDO',
    etapa: etapa || 'CONTACTO',
    valorEstimado: valorEstimado ? Number(valorEstimado) : null,
    notas, fechaContacto,
    proximoContacto: proximoContacto || null,
    createdAt: now, updatedAt: now,
  })
  const [row] = await db.select().from(prospectos).where(and(eq(prospectos.id, id), eq(prospectos.userId, userId)))
  return NextResponse.json(row, { status: 201 })
}
