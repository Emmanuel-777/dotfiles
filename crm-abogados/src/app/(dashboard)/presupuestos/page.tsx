import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileSignature, Plus } from 'lucide-react'
import { requireUserId } from '@/lib/auth'
import { presupuestosHabilitados } from '@/lib/presupuestos/flag'
import { listarPresupuestos } from '@/lib/presupuestos/repo'
import { formatoMonto, totalComprometido } from '@/lib/presupuestos/calculo'
import { formatFechaCorta } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const ESTADO_UI: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  ENVIADO: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  ACEPTADO: { label: 'Aceptado', color: 'bg-emerald-100 text-emerald-700' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  VENCIDO: { label: 'Vencido', color: 'bg-amber-100 text-amber-800' },
}

export default async function PresupuestosPage() {
  if (!presupuestosHabilitados()) notFound()
  const userId = await requireUserId()
  const filas = await listarPresupuestos(userId)

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-blue-600" />
            Presupuestos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Propuestas de honorarios por etapa, con abono, saldo y cuotas.</p>
        </div>
        <Link href="/presupuestos/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo presupuesto
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {filas.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">
            Aún no tienes presupuestos. Crea el primero con una plantilla por materia.
          </p>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header">Folio</th>
                <th className="table-header">Cliente / materia</th>
                <th className="table-header">Fecha</th>
                <th className="table-header text-right">Total comprometido</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filas.map((p) => {
                const ui = ESTADO_UI[p.estado] ?? ESTADO_UI.BORRADOR
                const total = totalComprometido(p.etapas)
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs">
                      <Link href={`/presupuestos/${p.id}`} className="text-blue-600 hover:text-blue-700">{p.folio}</Link>
                    </td>
                    <td className="table-cell">
                      <p className="font-medium">{p.clienteNombre || 'Sin cliente'}</p>
                      <p className="text-xs text-gray-500">{p.materia || 'Materia por definir'}</p>
                    </td>
                    <td className="table-cell">{formatFechaCorta(`${p.fecha}T12:00:00`)}</td>
                    <td className="table-cell text-right font-mono">{formatoMonto(total, p.moneda === 'UF' ? 'UF' : 'CLP')}</td>
                    <td className="table-cell"><span className={`badge ${ui.color}`}>{ui.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
