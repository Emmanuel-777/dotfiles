import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { asesorias } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const [asesoria] = await db.select().from(asesorias).where(and(eq(asesorias.id, params.id), eq(asesorias.userId, userId)))
  if (!asesoria) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(asesoria)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if ('fecha' in body) updates.fecha = body.fecha
  if ('tipo' in body) updates.tipo = body.tipo
  if ('descripcion' in body) updates.descripcion = body.descripcion
  if ('archivoUrl' in body) updates.archivoUrl = body.archivoUrl || null
  if ('archivoNombre' in body) updates.archivoNombre = body.archivoNombre || null

  await db.update(asesorias).set(updates).where(and(eq(asesorias.id, params.id), eq(asesorias.userId, userId)))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(asesorias).where(and(eq(asesorias.id, params.id), eq(asesorias.userId, userId)))
  return NextResponse.json({ ok: true })
}
