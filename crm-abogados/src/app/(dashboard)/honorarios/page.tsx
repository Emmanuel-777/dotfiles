import { db, initDB } from '@/lib/db'
import { honorarios, clientes, causas } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, DollarSign, TrendingUp, Pencil } from 'lucide-react'
import { formatMonto, formatFechaCorta, ESTADOS_HONORARIO } from '@/lib/utils'
import { requireUserId } from '@/lib/auth'
import MonthlyBarChart, { type MonthBucket } from '@/components/MonthlyBarChart'

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

  // Base para tasa de cobro: todo lo emitido (excluye anulados)
  const emitidoBase = rows.filter((r) => r.honorario.estado !== 'ANULADO').reduce((s, r) => s + r.honorario.monto, 0)
  const tasaCobro = emitidoBase > 0 ? Math.round((totales.pagado / emitidoBase) * 100) : 0

  // Buckets de los últimos 6 meses
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const ahora = new Date()
  const buckets: MonthBucket[] = []
  const indexPorClave = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const clave = `${d.getFullYear()}-${d.getMonth()}`
    indexPorClave.set(clave, buckets.length)
    buckets.push({ label: MESES[d.getMonth()], emitido: 0, cobrado: 0 })
  }
  for (const { honorario: h } of rows) {
    if (h.estado === 'ANULADO') continue
    const fe = h.fechaEmision ? new Date(h.fechaEmision) : null
    if (fe && !isNaN(fe.getTime())) {
      const idx = indexPorClave.get(`${fe.getFullYear()}-${fe.getMonth()}`)
      if (idx !== undefined) buckets[idx].emitido += h.monto
    }
    if (h.estado === 'PAGADO') {
      const fp = new Date(h.fechaPago ?? h.fechaEmision)
      if (!isNaN(fp.getTime())) {
        const idx = indexPorClave.get(`${fp.getFullYear()}-${fp.getMonth()}`)
        if (idx !== undefined) buckets[idx].cobrado += h.monto
      }
    }
  }
  const hayDatosGrafico = buckets.some((b) => b.emitido > 0 || b.cobrado > 0)

  return (
    <div className="p-4 lg:p-8">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        <div className="card p-5 border-l-4 border-violet-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Tasa de cobro
          </p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tasaCobro}%</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${tasaCobro}%` }} />
          </div>
        </div>
      </div>

      {hayDatosGrafico && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Honorarios por mes — últimos 6 meses</h2>
          <MonthlyBarChart data={buckets} />
        </div>
      )}

      <div className="card overflow-hidden overflow-x-auto">
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
              <th className="table-header" />
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
                    {h.fechaPago && <p className="text-xs text-green-600">Pagado: {formatFechaCorta(h.fechaPago)}</p>}
                  </td>
                  <td className="table-cell text-gray-600 text-sm">{cliente?.nombre}</td>
                  <td className="table-cell font-mono text-xs text-gray-500">{causa?.rol || '—'}</td>
                  <td className="table-cell"><span className="badge bg-gray-100 text-gray-700">{h.tipo}</span></td>
                  <td className="table-cell text-gray-600 text-sm">{formatFechaCorta(h.fechaEmision)}</td>
                  <td className="table-cell text-right font-semibold text-gray-900">{formatMonto(h.monto)}</td>
                  <td className="table-cell text-center">
                    <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                  </td>
                  <td className="table-cell text-center">
                    <Link href={`/honorarios/${h.id}/editar`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Link>
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
