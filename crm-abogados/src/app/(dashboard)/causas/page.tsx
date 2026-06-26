import { db, initDB } from '@/lib/db'
import { causas, clientes, plazos } from '@/lib/schema'
import { eq, desc, and, gte } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Briefcase, AlertTriangle } from 'lucide-react'
import { formatFechaCorta, ESTADOS_CAUSA } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function CausasPage() {
  await initDB()
  const userId = await requireUserId()
  const hoy = new Date().toISOString()

  const rows = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(causas.userId, userId))
    .orderBy(desc(causas.createdAt))

  const proximosPlazos = await db
    .select()
    .from(plazos)
    .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy)))
    .orderBy(plazos.fecha)

  const plazosPorCausa: Record<string, typeof proximosPlazos[0]> = {}
  for (const p of proximosPlazos) {
    if (!plazosPorCausa[p.causaId]) plazosPorCausa[p.causaId] = p
  }

  const porEstado = {
    EN_TRAMITE: rows.filter((r) => r.causa.estado === 'EN_TRAMITE').length,
    TERMINADA: rows.filter((r) => r.causa.estado === 'TERMINADA').length,
    SUSPENDIDA: rows.filter((r) => r.causa.estado === 'SUSPENDIDA').length,
    ARCHIVADA: rows.filter((r) => r.causa.estado === 'ARCHIVADA').length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Causas</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} causas en total</p>
        </div>
        <Link href="/causas/nueva" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva causa
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(porEstado).map(([estado, count]) => {
          const info = ESTADOS_CAUSA[estado as keyof typeof ESTADOS_CAUSA]
          return (
            <div key={estado} className="card p-4">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <span className={`badge mt-1 ${info.color}`}>{info.label}</span>
            </div>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">ROL / RIT</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Tribunal</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Próximo plazo</th>
              <th className="table-header">Estado</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ causa, cliente }) => {
              const estadoInfo = ESTADOS_CAUSA[causa.estado as keyof typeof ESTADOS_CAUSA]
              const proximoPlazo = plazosPorCausa[causa.id]
              return (
                <tr key={causa.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-mono font-medium text-blue-700">{causa.rol}</td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{cliente?.nombre}</p>
                    <p className="text-xs text-gray-500">{cliente?.rut}</p>
                  </td>
                  <td className="table-cell text-gray-600 max-w-[200px]">
                    <p className="truncate text-xs">{causa.tribunal}</p>
                  </td>
                  <td className="table-cell text-gray-600">{causa.tipoCausa}</td>
                  <td className="table-cell">
                    {proximoPlazo ? (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">{proximoPlazo.titulo}</p>
                          <p className="text-xs text-gray-500">{formatFechaCorta(proximoPlazo.fecha)}</p>
                        </div>
                      </div>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                  </td>
                  <td className="table-cell">
                    <Link href={`/causas/${causa.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Ver</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="No hay causas registradas"
            description="Registra tu primera causa para hacer seguimiento de actuaciones, plazos y documentos."
            actionLabel="Nueva causa"
            actionHref="/causas/nueva"
          />
        )}
      </div>
    </div>
  )
}
