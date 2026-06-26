import { db, initDB } from '@/lib/db'
import { honorarios, clientes, causas } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, DollarSign } from 'lucide-react'
import { formatMonto, formatFechaCorta, ESTADOS_HONORARIO } from '@/lib/utils'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function HonorariosPage() {
  await initDB()
  const userId = await requireUserId()
  const rows = await db
    .select({ honorario: honorarios, cliente: clientes, causa: causas })
    .from(honorarios)
    .leftJoin(clientes, eq(honorarios.clienteId, clientes.id))
    .leftJoin(causas, eq(honorarios.causaId, causas.id))
    .where(eq(honorarios.userId, userId))
    .orderBy(desc(honorarios.createdAt))

  const totales = {
    pendiente: rows.filter((r) => r.honorario.estado === 'PENDIENTE' || r.honorario.estado === 'PARCIAL').reduce((s, r) => s + r.honorario.monto, 0),
    pagado: rows.filter((r) => r.honorario.estado === 'PAGADO').reduce((s, r) => s + r.honorario.monto, 0),
    total: rows.reduce((s, r) => s + r.honorario.monto, 0),
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Honorarios</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} registros</p>
        </div>
        <Link href="/honorarios/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo honorario
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5 border-l-4 border-emerald-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total cobrado</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatMonto(totales.pagado)}</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Por cobrar</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatMonto(totales.pendiente)}</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total emitido</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatMonto(totales.total)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Descripción</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Causa</th>
              <th className="table-header">Tipo</th>
              <th className="table-header">Fecha</th>
              <th className="table-header text-right">Monto</th>
              <th className="table-header text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ honorario: h, cliente, causa }) => {
              const estadoInfo = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
              return (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{h.descripcion}</p>
                    {h.fechaVence && <p className="text-xs text-amber-600">Vence: {formatFechaCorta(h.fechaVence)}</p>}
                  </td>
                  <td className="table-cell text-gray-600 text-sm">{cliente?.nombre}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{causa?.rol || '—'}</td>
                  <td className="table-cell"><span className="badge bg-gray-100 text-gray-700">{h.tipo}</span></td>
                  <td className="table-cell text-gray-600 text-sm">{formatFechaCorta(h.fechaEmision)}</td>
                  <td className="table-cell text-right font-semibold text-gray-900">{formatMonto(h.monto)}</td>
                  <td className="table-cell text-center">
                    <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No hay honorarios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
