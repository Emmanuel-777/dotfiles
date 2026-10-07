import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { presupuestosHabilitados } from '@/lib/presupuestos/flag'
import { guardarPerfil, obtenerPerfil } from '@/lib/presupuestos/repo'

export const dynamic = 'force-dynamic'

const noEncontrado = () => NextResponse.json({ error: 'No encontrado' }, { status: 404 })

export async function GET() {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await obtenerPerfil(userId))
}

export async function PUT(req: Request) {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  return NextResponse.json(await guardarPerfil(userId, body as Record<string, unknown>))
}
