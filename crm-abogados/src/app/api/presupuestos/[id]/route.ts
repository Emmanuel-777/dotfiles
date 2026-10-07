import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { presupuestosHabilitados } from '@/lib/presupuestos/flag'
import { actualizarPresupuesto, eliminarPresupuesto, obtenerPresupuesto, sanitizar } from '@/lib/presupuestos/repo'
import { registrarAuditoria } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const noEncontrado = () => NextResponse.json({ error: 'No encontrado' }, { status: 404 })

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const p = await obtenerPresupuesto(userId, params.id)
  return p ? NextResponse.json(p) : noEncontrado()
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })

  const previo = await obtenerPresupuesto(userId, params.id)
  if (!previo) return noEncontrado()

  const datos = sanitizar(body as Record<string, unknown>)
  const actualizado = await actualizarPresupuesto(userId, params.id, datos)
  const cambioEstado = previo.estado !== datos.estado ? `${previo.estado}→${datos.estado}` : null
  await registrarAuditoria({
    userId,
    accion: cambioEstado ? 'ESTADO_PRESUPUESTO' : 'UPDATE_PRESUPUESTO',
    entidad: 'presupuesto',
    entidadId: params.id,
    detalle: cambioEstado ?? previo.folio,
  })
  return NextResponse.json(actualizado)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!presupuestosHabilitados()) return noEncontrado()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const ok = await eliminarPresupuesto(userId, params.id)
  if (!ok) return noEncontrado()
  await registrarAuditoria({ userId, accion: 'DELETE_PRESUPUESTO', entidad: 'presupuesto', entidadId: params.id })
  return NextResponse.json({ ok: true })
}
