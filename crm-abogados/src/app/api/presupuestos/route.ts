import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { presupuestosHabilitados } from '@/lib/presupuestos/flag'
import { crearPresupuesto, listarPresupuestos, sanitizar } from '@/lib/presupuestos/repo'
import { registrarAuditoria } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const noEncontrado = () => NextResponse.json({ error: 'No encontrado' }, { status: 404 })

export async function GET() {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await listarPresupuestos(userId))
}

export async function POST(req: Request) {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })

  const datos = sanitizar(body as Record<string, unknown>)
  const creado = await crearPresupuesto(userId, datos)
  await registrarAuditoria({ userId, accion: 'CREATE_PRESUPUESTO', entidad: 'presupuesto', entidadId: creado?.id, detalle: creado?.folio })
  return NextResponse.json(creado, { status: 201 })
}
