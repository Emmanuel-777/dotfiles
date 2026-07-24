import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { esAdmin } from '@/lib/acceso'
import { listarCuentas } from '@/lib/cuentas'
import AdminCuentaAcciones from '@/components/AdminCuentaAcciones'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADO_BADGE: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700',
  activo: 'bg-green-100 text-green-700',
  bloqueado: 'bg-red-100 text-red-700',
  suspendido: 'bg-amber-100 text-amber-700',
}
const ESTADO_LABEL: Record<string, string> = {
  trial: 'En prueba', activo: 'Pagado', bloqueado: 'Vencido', suspendido: 'Suspendido',
}

function diasRestantes(trialFin: string | null): string {
  if (!trialFin) return '—'
  const ms = Date.parse(trialFin) - Date.now()
  if (ms <= 0) return 'Vencida'
  return `${Math.ceil(ms / (24 * 60 * 60 * 1000))} días`
}

function fmtFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminPage() {
  const { sessionClaims } = await auth()
  const email = sessionClaims?.email as string | undefined
  if (!esAdmin(email)) notFound()

  const cuentas = await listarCuentas()

  const enPrueba = cuentas.filter((c) => c.estado === 'trial').length
  const pagados = cuentas.filter((c) => c.estado === 'activo').length

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="h-6 w-6 text-[#14254c]" />
        <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Pruebas y clientes del sistema. {enPrueba} en prueba · {pagados} pagados · {cuentas.length} en total.
      </p>

      {cuentas.length === 0 ? (
        <div className="card py-16 text-center text-gray-400">
          Todavía no hay cuentas de prueba registradas.
        </div>
      ) : (
        <div className="space-y-3">
          {cuentas.map((c) => (
            <div key={c.userId} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{c.nombre || 'Sin nombre'}</span>
                    <span className={`badge ${ESTADO_BADGE[c.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ESTADO_LABEL[c.estado] ?? c.estado}
                    </span>
                    <span className="badge bg-violet-100 text-violet-700">{c.plan === 'pro' ? 'Pro' : 'Básico'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{c.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    RUT {c.rut || '—'} · Alta {fmtFecha(c.createdAt)}
                    {c.estado === 'trial' && ` · Prueba: ${diasRestantes(c.trialFin)}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <AdminCuentaAcciones userId={c.userId} estado={c.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
