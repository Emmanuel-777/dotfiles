import { db, initDB } from '@/lib/db'
import { prospectos } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, TrendingUp, Bell } from 'lucide-react'
import { requireUserId } from '@/lib/auth'
import KanbanBoard from '@/components/KanbanBoard'
import EmptyState from '@/components/EmptyState'

export const dynamic = 'force-dynamic'

export default async function EmbudoPage() {
  await initDB()
  const userId = await requireUserId()

  const rows = await db
    .select()
    .from(prospectos)
    .where(eq(prospectos.userId, userId))
    .orderBy(desc(prospectos.createdAt))

  const activos = rows.filter(r => r.etapa !== 'PERDIDO' && r.etapa !== 'GANADO')
  const ganados = rows.filter(r => r.etapa === 'GANADO')
  const perdidos = rows.filter(r => r.etapa === 'PERDIDO')
  const valorPipeline = activos.reduce((sum, r) => sum + (r.valorEstimado ?? 0), 0)
  const tasaConversion = rows.length > 0 ? Math.round((ganados.length / rows.length) * 100) : 0

  // Seguimientos pendientes: prospectos activos con recordatorio para hoy o vencido
  const hoyFecha = new Date().toISOString().split('T')[0]
  const seguimientosPendientes = activos.filter(
    r => r.proximoContacto && r.proximoContacto <= hoyFecha
  ).length

  const fmtValor = (v: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Embudo comercial</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} prospectos en total</p>
        </div>
        <Link href="/embudo/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo prospecto
        </Link>
      </div>

      {seguimientosPendientes > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Bell className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Tienes <span className="font-semibold">{seguimientosPendientes}</span>{' '}
            {seguimientosPendientes === 1 ? 'prospecto que requiere' : 'prospectos que requieren'} seguimiento hoy o antes.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-2xl font-bold text-gray-900">{activos.length}</p>
          <p className="text-xs text-gray-500 mt-1">En pipeline activo</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-blue-700">
            {valorPipeline > 0 ? fmtValor(valorPipeline) : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Valor estimado</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-700">{ganados.length}</p>
          <p className="text-xs text-gray-500 mt-1">Ganados</p>
        </div>
        <div className="card p-4">
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-gray-900">{tasaConversion}%</p>
            {perdidos.length > 0 && (
              <p className="text-xs text-red-400 mb-0.5">{perdidos.length} perdido{perdidos.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Tasa de conversión</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin prospectos todavía"
          description="Registra tu primer prospecto para hacer seguimiento del embudo comercial."
          actionLabel="Nuevo prospecto"
          actionHref="/embudo/nuevo"
        />
      ) : (
        <KanbanBoard prospectos={rows} />
      )}
    </div>
  )
}
