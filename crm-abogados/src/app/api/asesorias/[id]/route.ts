import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { asesorias } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(asesorias).where(and(eq(asesorias.id, params.id), eq(asesorias.userId, userId)))
  return NextResponse.json({ ok: true })
}
