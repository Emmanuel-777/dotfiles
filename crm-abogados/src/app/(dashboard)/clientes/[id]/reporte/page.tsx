import { db, initDB } from '@/lib/db'
import { clientes, causas, tareas, plazos, honorarios, actuaciones } from '@/lib/schema'
import { eq, and, inArray, asc, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Scale } from 'lucide-react'
import {
  formatMonto, formatFechaCorta, formatFechaHoraChile,
  ESTADOS_CAUSA, ESTADOS_TAREA, PRIORIDADES_TAREA, ESTADOS_HONORARIO,
} from '@/lib/utils'
import PrintButton from '@/components/PrintButton'
import { requireUserId } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

function formatFechaLarga(fecha: string) {
  const d = new Date(fecha.length === 10 ? fecha + 'T00:00:00' : fecha)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const TIPO_COLORS: Record<string, string> = {
  'Audiencia':              'bg-purple-100 text-purple-800',
  'Presentación de escrito':'bg-blue-100 text-blue-800',
  'Notificación enviada':   'bg-cyan-100 text-cyan-800',
  'Notificación recibida':  'bg-cyan-100 text-cyan-800',
  'Resolución recibida':    'bg-indigo-100 text-indigo-800',
  'Llamada con cliente':    'bg-green-100 text-green-800',
  'Diligencia judicial':    'bg-orange-100 text-orange-800',
}

export default async function ReporteClientePage({ params }: { params: { id: string } }) {
  await initDB()
  const userId = await requireUserId()

  const client = await clerkClient()
  const abogado = await client.users.getUser(userId)
  const nombreAbogado = `${abogado.firstName ?? ''} ${abogado.lastName ?? ''}`.trim() || 'Abogado/a'

  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
  if (!cliente) notFound()

  const clienteCausas = await db.select().from(causas)
    .where(and(eq(causas.clienteId, params.id), eq(causas.userId, userId)))
    .orderBy(asc(causas.fechaIngreso))

  const causaIds = clienteCausas.map((c) => c.id)

  const [todasActuaciones, todasTareas, todosPlazos, todosHonorarios] = causaIds.length > 0
    ? await Promise.all([
        db.select().from(actuaciones).where(and(eq(actuaciones.userId, userId), inArray(actuaciones.causaId, causaIds))).orderBy(desc(actuaciones.fecha)),
        db.select().from(tareas).where(and(eq(tareas.userId, userId), inArray(tareas.causaId, causaIds))).orderBy(asc(tareas.fechaVencimiento)),
        db.select().from(plazos).where(and(eq(plazos.userId, userId), inArray(plazos.causaId, causaIds))).orderBy(asc(plazos.fecha)),
        db.select().from(honorarios).where(and(eq(honorarios.userId, userId), inArray(honorarios.causaId, causaIds))).orderBy(asc(honorarios.fechaEmision)),
      ])
    : [[], [], [], []]

  const totalPagado     = todosHonorarios.filter((h) => h.estado === 'PAGADO').reduce((s, h) => s + h.monto, 0)
  const totalPendiente  = todosHonorarios.filter((h) => ['PENDIENTE','PARCIAL'].includes(h.estado)).reduce((s, h) => s + h.monto, 0)
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 2cm; size: A4; }
          body { font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Barra de control */}
      <div className="no-print flex items-center justify-between px-8 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Volver al cliente
        </Link>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0">

        {/* Encabezado del informe */}
        <div className="flex items-start justify-between mb-8 pb-5 border-b-2 border-gray-900">
          <div className="flex items-center gap-3">
            <div className="bg-blue-700 rounded-lg p-2">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{nombreAbogado}</p>
              <p className="text-xs text-gray-500">LexCRM · Gestión Legal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Informe de Gestiones</p>
            <p className="text-xs text-gray-500 mt-0.5">{hoy}</p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Cliente</p>
          <h1 className="text-xl font-bold text-gray-900">{cliente.nombre}</h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">RUT: {cliente.rut}</p>
          {(cliente.email || cliente.celular) && (
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              {cliente.email && <span>{cliente.email}</span>}
              {cliente.celular && <span>{cliente.celular}</span>}
            </div>
          )}
        </div>

        {/* Resumen financiero si hay honorarios */}
        {todosHonorarios.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-emerald-600">{formatMonto(totalPagado)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Honorarios pagados</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xl font-bold text-amber-600">{formatMonto(totalPendiente)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Honorarios pendientes</p>
            </div>
          </div>
        )}

        {/* Una sección por causa */}
        {clienteCausas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Sin causas registradas</p>
        ) : (
          <div className="space-y-10">
            {clienteCausas.map((causa, idx) => {
              const estadoInfo = ESTADOS_CAUSA[causa.estado as keyof typeof ESTADOS_CAUSA]
              const acts        = todasActuaciones.filter((a) => a.causaId === causa.id)
              const tareasActivas    = todasTareas.filter((t) => t.causaId === causa.id && !['COMPLETADA','CANCELADA'].includes(t.estado))
              const tareasCompletadas = todasTareas.filter((t) => t.causaId === causa.id && t.estado === 'COMPLETADA')
              const causaPlazos      = todosPlazos.filter((p) => p.causaId === causa.id)
              const causaHonorarios  = todosHonorarios.filter((h) => h.causaId === causa.id)

              return (
                <div key={causa.id} className={idx > 0 ? 'page-break' : ''}>
                  {/* Cabecera causa */}
                  <div className="border-2 border-gray-800 rounded-t-lg px-5 py-4 bg-gray-900 text-white flex items-start justify-between">
                    <div>
                      <p className="font-mono font-bold text-lg leading-none">{causa.rol}</p>
                      <p className="text-gray-300 text-xs mt-1">{causa.tribunal}</p>
                      <p className="text-gray-400 text-xs">{causa.tipoCausa}{causa.materia ? ` · ${causa.materia}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${estadoInfo?.color} text-xs`}>{estadoInfo?.label}</span>
                      {causa.abogadoResponsable && (
                        <p className="text-gray-400 text-xs mt-1">Abog. {causa.abogadoResponsable}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">Ingreso: {formatFechaCorta(causa.fechaIngreso)}</p>
                    </div>
                  </div>

                  <div className="border-2 border-t-0 border-gray-800 rounded-b-lg overflow-hidden divide-y divide-gray-100">

                    {/* Gestiones realizadas */}
                    {acts.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                          Gestiones realizadas ({acts.length})
                        </p>
                        <div className="space-y-3">
                          {acts.map((act) => {
                            const color = TIPO_COLORS[act.tipo] ?? 'bg-gray-100 text-gray-700'
                            return (
                              <div key={act.id} className="flex gap-3">
                                {/* Línea de tiempo */}
                                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600 mt-0.5" />
                                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                                </div>
                                <div className="pb-3 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                                      {formatFechaLarga(act.fecha)}
                                    </span>
                                    <span className={`badge text-[10px] ${color}`}>{act.tipo}</span>
                                  </div>
                                  <p className="text-sm text-gray-800 mt-0.5">{act.descripcion}</p>
                                  {act.resultado && (
                                    <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1 mt-1 border border-green-100">
                                      {act.resultado}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {acts.length === 0 && (
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gestiones realizadas</p>
                        <p className="text-xs text-gray-400 italic">Sin gestiones registradas aún</p>
                      </div>
                    )}

                    {/* Plazos próximos */}
                    {causaPlazos.filter((p) => p.estado === 'PENDIENTE').length > 0 && (
                      <div className="px-5 py-4 bg-amber-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
                          Próximos plazos
                        </p>
                        <div className="space-y-1.5">
                          {causaPlazos.filter((p) => p.estado === 'PENDIENTE').map((plazo) => (
                            <div key={plazo.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-800">{plazo.titulo}</span>
                              <span className="text-amber-700 font-semibold text-xs whitespace-nowrap ml-3">
                                {formatFechaLarga(plazo.fecha)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tareas activas */}
                    {tareasActivas.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Gestiones en curso
                        </p>
                        <div className="space-y-2">
                          {tareasActivas.map((tarea) => {
                            const prioridadT = PRIORIDADES_TAREA[tarea.prioridad as keyof typeof PRIORIDADES_TAREA]
                            const estadoT = ESTADOS_TAREA[tarea.estado as keyof typeof ESTADOS_TAREA]
                            return (
                              <div key={tarea.id} className="flex items-start justify-between gap-3 text-sm">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <span className={`badge flex-shrink-0 text-[10px] ${prioridadT?.color}`}>{prioridadT?.label}</span>
                                  <div>
                                    <p className="text-gray-800">{tarea.titulo}</p>
                                    {tarea.asignadoA && (
                                      <p className="text-xs text-gray-500">→ {tarea.asignadoA}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className={`badge text-[10px] ${estadoT?.color}`}>{estadoT?.label}</span>
                                  {tarea.fechaVencimiento && (
                                    <p className="text-xs text-gray-500 mt-0.5">{formatFechaHoraChile(tarea.fechaVencimiento)}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tareas completadas */}
                    {tareasCompletadas.length > 0 && (
                      <div className="px-5 py-4 bg-gray-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Completadas
                        </p>
                        <div className="space-y-1">
                          {tareasCompletadas.map((tarea) => (
                            <p key={tarea.id} className="text-xs text-gray-400 line-through">{tarea.titulo}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Honorarios */}
                    {causaHonorarios.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Honorarios</p>
                        <div className="space-y-1.5">
                          {causaHonorarios.map((h) => {
                            const estadoH = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
                            return (
                              <div key={h.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 flex-1 truncate pr-3">{h.descripcion}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="font-bold text-gray-900">{formatMonto(h.monto)}</span>
                                  <span className={`badge text-[10px] ${estadoH?.color}`}>{estadoH?.label}</span>
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

        {/* Pie de página */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400">
          <span>LexCRM · Gestión Legal</span>
          <span>Generado el {hoy}</span>
        </div>
      </div>
    </>
  )
}
