import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { actuaciones } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if ('fecha' in body) updates.fecha = body.fecha
  if ('tipo' in body) updates.tipo = body.tipo
  if ('descripcion' in body) updates.descripcion = body.descripcion
  if ('resultado' in body) updates.resultado = body.resultado ?? null
  if ('compromiso' in body) updates.compromiso = body.compromiso ?? null
  if ('fechaRecordatorio' in body) updates.fechaRecordatorio = body.fechaRecordatorio ?? null
  if ('recordatorioEnviado' in body) updates.recordatorioEnviado = body.recordatorioEnviado ? 1 : 0

  await db.update(actuaciones).set(updates).where(and(eq(actuaciones.id, params.id), eq(actuaciones.userId, userId)))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(actuaciones).where(and(eq(actuaciones.id, params.id), eq(actuaciones.userId, userId)))
  return NextResponse.json({ ok: true })
}
