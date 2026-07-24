import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { esAdmin } from '@/lib/acceso'
import { listarUsuariosAdmin } from '@/lib/cuentas'
import AdminCuentaAcciones from '@/components/AdminCuentaAcciones'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TIPO_BADGE: Record<string, string> = {
  cliente: 'bg-emerald-100 text-emerald-700',
  trial: 'bg-blue-100 text-blue-700',
  activo: 'bg-green-100 text-green-700',
  bloqueado: 'bg-red-100 text-red-700',
  suspendido: 'bg-amber-100 text-amber-700',
  sin_acceso: 'bg-gray-100 text-gray-500',
}
const TIPO_LABEL: Record<string, string> = {
  cliente: 'Cliente', trial: 'En prueba', activo: 'Pagado',
  bloqueado: 'Vencido', suspendido: 'Suspendido', sin_acceso: 'Sin acceso',
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
  const { userId: adminUserId, sessionClaims } = await auth()
  const email = sessionClaims?.email as string | undefined
  if (!esAdmin(email)) notFound()

  const usuarios = await listarUsuariosAdmin()

  const clientes = usuarios.filter((u) => u.tipo === 'cliente' || u.tipo === 'activo').length
  const enPrueba = usuarios.filter((u) => u.tipo === 'trial').length

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="h-6 w-6 text-[#14254c]" />
        <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        {usuarios.length} usuarios · {clientes} clientes · {enPrueba} en prueba
      </p>

      {usuarios.length === 0 ? (
        <div className="card py-16 text-center text-gray-400">Todavía no hay usuarios registrados.</div>
      ) : (
        <div className="space-y-3">
          {usuarios.map((u) => (
            <div key={u.userId} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{u.nombre}</span>
                    <span className={`badge ${TIPO_BADGE[u.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TIPO_LABEL[u.tipo] ?? u.tipo}
                    </span>
                    <span className="badge bg-violet-100 text-violet-700">{u.plan === 'pro' ? 'Pro' : 'Básico'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{u.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.rut ? `RUT ${u.rut} · ` : ''}Alta {fmtFecha(u.createdAt)}
                    {u.tipo === 'trial' && ` · Prueba: ${diasRestantes(u.trialFin)}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                {u.userId === adminUserId ? (
                  <p className="text-xs text-gray-400">Tu propia cuenta.</p>
                ) : (
                  <>
                    {!u.gestionable && u.tipo === 'cliente' && (
                      <p className="text-xs text-gray-400 mb-2">Cliente permanente — gestionado por la lista de autorizados.</p>
                    )}
                    <AdminCuentaAcciones
                      userId={u.userId}
                      estado={u.tipo}
                      gestionable={u.gestionable}
                      puedeEliminar
                      etiqueta={`${u.nombre} (${u.email})`}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
