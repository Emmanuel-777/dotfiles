import { db, initDB } from '@/lib/db'
import { clientes, causas, honorarios } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Phone, Mail, MapPin, Briefcase, DollarSign, Plus } from 'lucide-react'
import { formatMonto, formatFechaCorta, ESTADOS_CAUSA, ESTADOS_HONORARIO } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  await initDB()
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, params.id))
  if (!cliente) notFound()

  const [clienteCausas, clienteHonorarios] = await Promise.all([
    db.select().from(causas).where(eq(causas.clienteId, params.id)),
    db.select().from(honorarios).where(eq(honorarios.clienteId, params.id)),
  ])

  const totalPagado = clienteHonorarios.filter((h) => h.estado === 'PAGADO').reduce((s, h) => s + h.monto, 0)
  const totalPendiente = clienteHonorarios.filter((h) => h.estado === 'PENDIENTE' || h.estado === 'PARCIAL').reduce((s, h) => s + h.monto, 0)

  return (
    <div className="p-8">
      <Link href="/clientes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${cliente.tipo === 'PERSONA_JURIDICA' ? 'bg-violet-100' : 'bg-blue-100'}`}>
            {cliente.tipo === 'PERSONA_JURIDICA'
              ? <Building2 className="h-8 w-8 text-violet-600" />
              : <User className="h-8 w-8 text-blue-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{cliente.nombre}</h1>
                <p className="text-gray-500 font-mono mt-0.5">{cliente.rut}</p>
                <span className="badge bg-gray-100 text-gray-700 mt-2">
                  {cliente.tipo === 'PERSONA_JURIDICA' ? 'Persona Jurídica' : 'Persona Natural'}
                </span>
              </div>
              <Link href={`/clientes/${cliente.id}/editar`} className="btn-secondary">Editar</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-4 w-4 text-gray-400" />{cliente.email}</div>
              )}
              {cliente.celular && (
                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="h-4 w-4 text-gray-400" />{cliente.celular}</div>
              )}
              {cliente.ciudad && (
                <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4 text-gray-400" />{cliente.ciudad}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{clienteCausas.length}</p>
          <p className="text-sm text-gray-500 mt-1">Causas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{formatMonto(totalPagado)}</p>
          <p className="text-sm text-gray-500 mt-1">Cobrado</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{formatMonto(totalPendiente)}</p>
          <p className="text-sm text-gray-500 mt-1">Por cobrar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              Causas ({clienteCausas.length})
            </h2>
            <Link href={`/causas/nueva?clienteId=${cliente.id}`} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Nueva
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {clienteCausas.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-gray-400">Sin causas</p>
            ) : (
              clienteCausas.map((causa) => {
                const estadoInfo = ESTADOS_CAUSA[causa.estado as keyof typeof ESTADOS_CAUSA]
                return (
                  <Link key={causa.id} href={`/causas/${causa.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{causa.rol}</p>
                      <p className="text-xs text-gray-500">{causa.tipoCausa} · {causa.tribunal}</p>
                    </div>
                    <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Honorarios ({clienteHonorarios.length})
            </h2>
            <Link href={`/honorarios/nuevo?clienteId=${cliente.id}`} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Nuevo
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {clienteHonorarios.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-gray-400">Sin honorarios</p>
            ) : (
              clienteHonorarios.slice(0, 5).map((h) => {
                const estadoInfo = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
                return (
                  <div key={h.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.descripcion}</p>
                      <p className="text-xs text-gray-500">{formatFechaCorta(h.fechaEmision)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatMonto(h.monto)}</p>
                      <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {cliente.notas && (
        <div className="card p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
          <p className="text-sm text-gray-600">{cliente.notas}</p>
        </div>
      )}
    </div>
  )
}
