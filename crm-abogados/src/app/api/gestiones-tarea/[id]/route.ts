import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { gestionesTarea } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await db.delete(gestionesTarea).where(and(eq(gestionesTarea.id, params.id), eq(gestionesTarea.userId, userId)))
  return NextResponse.json({ ok: true })
}
