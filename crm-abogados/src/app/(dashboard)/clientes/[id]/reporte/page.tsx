import { db, initDB } from '@/lib/db'
import { clientes, causas, tareas, plazos, honorarios } from '@/lib/schema'
import { eq, inArray, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Scale } from 'lucide-react'
import {
  formatMonto,
  formatFechaCorta,
  ESTADOS_CAUSA,
  ESTADOS_TAREA,
  PRIORIDADES_TAREA,
  ESTADOS_HONORARIO,
} from '@/lib/utils'
import PrintButton from '@/components/PrintButton'

export const dynamic = 'force-dynamic'

export default async function ReporteClientePage({ params }: { params: { id: string } }) {
  await initDB()

  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, params.id))
  if (!cliente) notFound()

  const clienteCausas = await db.select().from(causas).where(eq(causas.clienteId, params.id)).orderBy(asc(causas.fechaIngreso))
  const clienteHonorarios = await db.select().from(honorarios).where(eq(honorarios.clienteId, params.id)).orderBy(asc(honorarios.fechaEmision))

  const causaIds = clienteCausas.map((c) => c.id)

  const [todasTareas, todosPlazos] = causaIds.length > 0
    ? await Promise.all([
        db.select().from(tareas).where(inArray(tareas.causaId, causaIds)).orderBy(asc(tareas.fechaVencimiento)),
        db.select().from(plazos).where(inArray(plazos.causaId, causaIds)).orderBy(asc(plazos.fecha)),
      ])
    : [[], []]

  const totalPagado = clienteHonorarios.filter((h) => h.estado === 'PAGADO').reduce((s, h) => s + h.monto, 0)
  const totalPendiente = clienteHonorarios.filter((h) => ['PENDIENTE', 'PARCIAL'].includes(h.estado)).reduce((s, h) => s + h.monto, 0)

  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 2cm; size: A4; }
          body { font-size: 11pt; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Controles de pantalla */}
        <div className="flex items-center justify-between mb-6 no-print print:hidden">
          <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Volver al cliente
          </Link>
          <PrintButton />
        </div>

        {/* Cabecera del reporte */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">LexCRM</p>
              <p className="text-xs text-gray-500">Gestión Legal · Estudio Jurídico</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">Reporte de Cliente</p>
            <p className="text-xs text-gray-400">{hoy}</p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{cliente.nombre}</h1>
          <p className="text-gray-500 font-mono text-sm mt-0.5">RUT: {cliente.rut}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
            {cliente.email && <span>✉ {cliente.email}</span>}
            {cliente.celular && <span>📱 {cliente.celular}</span>}
            {cliente.telefono && <span>☎ {cliente.telefono}</span>}
            {cliente.ciudad && <span>📍 {cliente.ciudad}{cliente.region ? `, ${cliente.region}` : ''}</span>}
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{clienteCausas.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Causas</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{formatMonto(totalPagado)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Honorarios pagados</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-amber-600">{formatMonto(totalPendiente)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Honorarios pendientes</p>
          </div>
        </div>

        {/* Causas con detalle */}
        {clienteCausas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Sin causas registradas</p>
        ) : (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-2">
              Detalle de Causas
            </h2>
            {clienteCausas.map((causa) => {
              const estadoInfo = ESTADOS_CAUSA[causa.estado as keyof typeof ESTADOS_CAUSA]
              const causaTareas = todasTareas.filter((t) => t.causaId === causa.id)
              const causaPlazos = todosPlazos.filter((p) => p.causaId === causa.id)
              const causaHonorarios = clienteHonorarios.filter((h) => h.causaId === causa.id)
              const tareasActivas = causaTareas.filter((t) => !['COMPLETADA', 'CANCELADA'].includes(t.estado))
              const tareasCompletadas = causaTareas.filter((t) => t.estado === 'COMPLETADA')

              return (
                <div key={causa.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Cabecera causa */}
                  <div className="bg-gray-50 px-4 py-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 text-sm">{causa.rol}</span>
                        <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{causa.tribunal}</p>
                      <p className="text-xs text-gray-500">{causa.tipoCausa}{causa.materia ? ` · ${causa.materia}` : ''}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Ingreso: {formatFechaCorta(causa.fechaIngreso)}</p>
                      {causa.contraparte && <p>Contraparte: {causa.contraparte}</p>}
                      {causa.abogadoResponsable && <p>Abogado: {causa.abogadoResponsable}</p>}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {/* Plazos */}
                    {causaPlazos.length > 0 && (
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plazos y Audiencias</p>
                        <div className="space-y-1">
                          {causaPlazos.map((plazo) => (
                            <div key={plazo.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{plazo.titulo}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">{formatFechaCorta(plazo.fecha)}</span>
                                <span className={`badge ${plazo.estado === 'COMPLETADO' ? 'bg-green-100 text-green-700' : plazo.estado === 'CANCELADO' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                                  {plazo.estado === 'COMPLETADO' ? 'Completado' : plazo.estado === 'CANCELADO' ? 'Cancelado' : 'Pendiente'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tareas activas */}
                    {tareasActivas.length > 0 && (
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tareas Activas</p>
                        <div className="space-y-1.5">
                          {tareasActivas.map((tarea) => {
                            const estadoT = ESTADOS_TAREA[tarea.estado as keyof typeof ESTADOS_TAREA]
                            const prioridadT = PRIORIDADES_TAREA[tarea.prioridad as keyof typeof PRIORIDADES_TAREA]
                            return (
                              <div key={tarea.id} className="flex items-start justify-between text-xs gap-3">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className={`badge flex-shrink-0 ${prioridadT?.color}`}>{prioridadT?.label}</span>
                                  <span className="text-gray-700 truncate">{tarea.titulo}</span>
                                  {tarea.asignadoA && <span className="text-orange-600 flex-shrink-0">→ {tarea.asignadoA}</span>}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {tarea.fechaVencimiento && <span className="text-gray-500">{formatFechaCorta(tarea.fechaVencimiento)}</span>}
                                  <span className={`badge ${estadoT?.color}`}>{estadoT?.label}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tareas completadas */}
                    {tareasCompletadas.length > 0 && (
                      <div className="px-4 py-3 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tareas Completadas ({tareasCompletadas.length})</p>
                        <div className="space-y-1">
                          {tareasCompletadas.map((tarea) => (
                            <div key={tarea.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-400 line-through">{tarea.titulo}</span>
                              {tarea.fechaVencimiento && <span className="text-gray-400">{formatFechaCorta(tarea.fechaVencimiento)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Honorarios de esta causa */}
                    {causaHonorarios.length > 0 && (
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Honorarios</p>
                        <div className="space-y-1">
                          {causaHonorarios.map((h) => {
                            const estadoH = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
                            return (
                              <div key={h.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700 flex-1 truncate pr-2">{h.descripcion}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-gray-500">{formatFechaCorta(h.fechaEmision)}</span>
                                  <span className="font-semibold text-gray-900">{formatMonto(h.monto)}</span>
                                  <span className={`badge ${estadoH?.color}`}>{estadoH?.label}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Honorarios sin causa asignada */}
        {clienteHonorarios.filter((h) => !h.causaId).length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
              Honorarios Generales
            </h2>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {clienteHonorarios.filter((h) => !h.causaId).map((h) => {
                const estadoH = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
                return (
                  <div key={h.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div>
                      <p className="text-gray-800 font-medium">{h.descripcion}</p>
                      <p className="text-xs text-gray-400">{formatFechaCorta(h.fechaEmision)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{formatMonto(h.monto)}</span>
                      <span className={`badge ${estadoH?.color}`}>{estadoH?.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pie de página */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
          <span>LexCRM · Gestión Legal</span>
          <span>Generado el {hoy}</span>
        </div>
      </div>
    </>
  )
}
