import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { esAdmin } from '@/lib/acceso'
import { listarCuentas, activarPagado, suspenderCuenta, reactivarPrueba, eliminarCuenta } from '@/lib/cuentas'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  const email = sessionClaims?.email as string | undefined
  if (!userId || !esAdmin(email)) return null
  return userId
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const cuentas = await listarCuentas()
  return NextResponse.json(cuentas)
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const userId = typeof body?.userId === 'string' ? body.userId : ''
  const accion = typeof body?.accion === 'string' ? body.accion : ''
  if (!userId || !accion) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  try {
    switch (accion) {
      case 'activar': await activarPagado(userId); break
      case 'suspender': await suspenderCuenta(userId); break
      case 'reactivar': await reactivarPrueba(userId); break
      case 'eliminar': await eliminarCuenta(userId); break
      default: return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
