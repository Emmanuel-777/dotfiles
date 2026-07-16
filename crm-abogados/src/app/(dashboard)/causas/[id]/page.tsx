import { db, initDB } from '@/lib/db'
import { causas, clientes, actuaciones, plazos, documentos, honorarios, tareas } from '@/lib/schema'
import { eq, desc, asc, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, DollarSign, Scale, Plus, Clock, CheckCircle, AlertTriangle, User, ListTodo, UserCheck, KeyRound, Bell, Download } from 'lucide-react'
import { formatFechaCorta, formatFechaHoraChile, formatMonto, ESTADOS_CAUSA, ESTADOS_PLAZO, ESTADOS_HONORARIO, PRIORIDADES_TAREA, estaVencido, esCritico } from '@/lib/utils'
import TareaEstadoSelect from '@/components/TareaEstadoSelect'
import ReminderButtons from '@/components/ReminderButtons'
import AIPanel from '@/components/AIPanel'
import CausaDocUpload from '@/components/CausaDocUpload'
import { TIPOS_ESCRITO } from '@/lib/ai/prompts'
import { requireUserId } from '@/lib/auth'
import { parseCredenciales } from '@/lib/crypto'
import { getPlan } from '@/lib/plan'

export const dynamic = 'force-dynamic'

export default async function CausaDetallePage({ params }: { params: { id: string } }) {
  await initDB()
  const userId = await requireUserId()
  const plan = await getPlan()
  const [row] = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(and(eq(causas.id, params.id), eq(causas.userId, userId)))

  if (!row) notFound()
  const { causa, cliente } = row

  const [acts, pls, docs, hons, tareasList] = await Promise.all([
    db.select().from(actuaciones).where(and(eq(actuaciones.causaId, params.id), eq(actuaciones.userId, userId))).orderBy(desc(actuaciones.fecha)),
    db.select().from(plazos).where(and(eq(plazos.causaId, params.id), eq(plazos.userId, userId))).orderBy(asc(plazos.fecha)),
    db.select().from(documentos).where(and(eq(documentos.causaId, params.id), eq(documentos.userId, userId))).orderBy(desc(documentos.createdAt)),
    db.select().from(honorarios).where(and(eq(honorarios.causaId, params.id), eq(honorarios.userId, userId))).orderBy(desc(honorarios.createdAt)),
    db.select().from(tareas).where(and(eq(tareas.causaId, params.id), eq(tareas.userId, userId))).orderBy(asc(tareas.fechaVencimiento)),
  ])

  const estadoInfo = ESTADOS_CAUSA[causa.estado as keyof typeof ESTADOS_CAUSA]

  return (
    <div className="p-4 lg:p-8">
      <Link href="/causas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a causas
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Scale className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 font-mono">{causa.rol}</h1>
                <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
              </div>
              <p className="text-gray-600 mt-1">{causa.tribunal}</p>
              <p className="text-gray-500 text-sm">{causa.tipoCausa}{causa.materia ? ` · ${causa.materia}` : ''}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <Link href={`/clientes/${causa.clienteId}`} className="text-sm text-blue-600 hover:text-blue-700">
                  {cliente?.nombre}
                </Link>
                {cliente?.rut && <><span className="text-gray-400">·</span><span className="text-sm text-gray-500 font-mono">{cliente.rut}</span></>}
              </div>
            </div>
          </div>
          <Link href={`/causas/${causa.id}/editar`} className="btn-secondary">Editar</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Carátula</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{causa.contraparte || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Abogado responsable</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{causa.abogadoResponsable || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fecha ingreso</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{formatFechaCorta(causa.fechaIngreso)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Actuaciones</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{acts.length}</p>
          </div>
          {causa.fechaPrescripcion && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Prescripción penal
              </p>
              <p className={`text-sm font-medium mt-0.5 ${estaVencido(causa.fechaPrescripcion) ? 'text-red-600' : esCritico(causa.fechaPrescripcion) ? 'text-amber-600' : 'text-gray-800'}`}>
                {formatFechaCorta(causa.fechaPrescripcion)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Plazos */}
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Plazos y Audiencias
              </h2>
              <Link href={`/agenda/nuevo?causaId=${causa.id}`} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pls.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-gray-400">Sin plazos registrados</p>
              ) : (
                pls.map((plazo) => {
                  const estadoPlazo = ESTADOS_PLAZO[plazo.estado as keyof typeof ESTADOS_PLAZO]
                  const vencido = estaVencido(plazo.fecha)
                  const critico = esCritico(plazo.fecha)
                  return (
                    <div key={plazo.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {plazo.estado === 'COMPLETADO' ? <CheckCircle className="h-4 w-4 text-green-500" />
                            : vencido ? <AlertTriangle className="h-4 w-4 text-red-500" />
                            : critico ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                            : <Clock className="h-4 w-4 text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{plazo.titulo}</p>
                          <p className="text-xs text-gray-500">{plazo.tipo.replace(/_/g, ' ')}</p>
                          {plazo.notas && <p className="text-xs text-gray-400 mt-0.5">{plazo.notas}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${vencido && plazo.estado === 'PENDIENTE' ? 'text-red-600' : critico ? 'text-amber-600' : 'text-gray-700'}`}>
                          {formatFechaCorta(plazo.fecha)}
                        </p>
                        <span className={`badge ${estadoPlazo?.color}`}>{estadoPlazo?.label}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Tareas */}
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-violet-500" />
                Tareas ({tareasList.length})
              </h2>
              <Link
                href={`/causas/${causa.id}/tareas/nueva`}
                className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {tareasList.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-gray-400">Sin tareas registradas</p>
              ) : (
                tareasList.map((tarea) => {
                  const prioridadT = PRIORIDADES_TAREA[tarea.prioridad as keyof typeof PRIORIDADES_TAREA]
                  const vencida = tarea.fechaVencimiento ? estaVencido(tarea.fechaVencimiento) : false
                  const critica = tarea.fechaVencimiento ? esCritico(tarea.fechaVencimiento) : false
                  const creds = parseCredenciales(tarea.credencialesPortal) as { sistema?: string; usuario?: string } | null
                  return (
                    <div key={tarea.id} className="px-6 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`badge ${prioridadT?.color}`}>{prioridadT?.label}</span>
                            <p className="text-sm font-medium text-gray-900">{tarea.titulo}</p>
                            {tarea.esDerivada === 1 && (
                              <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                Derivada
                              </span>
                            )}
                          </div>
                          {tarea.asignadoA && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Asignado a: <span className="font-medium">{tarea.asignadoA}</span>
                              {tarea.asignadoEmail && <> · {tarea.asignadoEmail}</>}
                            </p>
                          )}
                          {creds?.sistema && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <KeyRound className="h-3 w-3" />
                              {creds.sistema}{creds.usuario ? ` · ${creds.usuario}` : ''}
                            </p>
                          )}
                          {tarea.descripcion && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{tarea.descripcion}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          <TareaEstadoSelect tareaId={tarea.id} estadoActual={tarea.estado} />
                          {tarea.fechaVencimiento && (
                            <p className={`text-xs font-medium ${vencida && tarea.estado === 'PENDIENTE' ? 'text-red-600' : critica ? 'text-amber-600' : 'text-gray-500'}`}>
                              {vencida && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                              {formatFechaHoraChile(tarea.fechaVencimiento)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Actuaciones */}
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-500" />
                Actuaciones ({acts.length})
              </h2>
              <Link href={`/causas/${causa.id}/actuacion`} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {acts.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-gray-400">Sin actuaciones</p>
              ) : (
                acts.map((act) => (
                  <div key={act.id} className="px-6 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge bg-blue-50 text-blue-700 text-[10px]">{act.tipo}</span>
                          <p className="text-sm font-medium text-gray-900">{act.descripcion}</p>
                        </div>
                        {act.resultado && (
                          <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-0.5 mt-1 inline-block">{act.resultado}</p>
                        )}
                        {act.compromiso && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-0.5">
                              <Bell className="h-3 w-3" />
                              Compromiso del cliente
                              {act.fechaRecordatorio && (
                                <span className="ml-1 text-amber-600">· {formatFechaHoraChile(act.fechaRecordatorio)}</span>
                              )}
                            </p>
                            <p className="text-xs text-amber-800">{act.compromiso}</p>
                            <ReminderButtons
                              actuacionId={act.id}
                              compromiso={act.compromiso}
                              fechaRecordatorio={act.fechaRecordatorio ?? null}
                              recordatorioEnviado={act.recordatorioEnviado}
                              clienteNombre={cliente?.nombre ?? ''}
                              clienteCelular={cliente?.celular ?? null}
                              clienteEmail={cliente?.email ?? null}
                              causaRol={causa.rol}
                              abogado={causa.abogadoResponsable ?? null}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap">{formatFechaCorta(act.fecha)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Lateral */}
        <div className="space-y-6">
          <AIPanel causaId={causa.id} tiposEscrito={TIPOS_ESCRITO} causaRol={causa.rol} causaTribunal={causa.tribunal ?? undefined} plan={plan} />

          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                Documentos
              </h2>
              <Link href={`/documentos/nuevo?causaId=${causa.id}`} className="text-blue-600 text-xs hover:text-blue-700 flex items-center gap-1 font-medium">
                <Plus className="h-3 w-3" /> Subir documento
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {docs.length === 0 ? (
                <p className="px-5 py-4 text-center text-xs text-gray-400">Sin documentos</p>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="px-5 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{doc.nombre}</p>
                      <p className="text-xs text-gray-400">{doc.tipo} · {formatFechaCorta(doc.createdAt!)}</p>
                    </div>
                    {doc.archivo && (
                      <a href={`/api/documentos/download?url=${encodeURIComponent(doc.archivo)}`}
                        className="flex-shrink-0 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        <Download className="h-3.5 w-3.5" />
                        Descargar
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
            <CausaDocUpload causaId={causa.id} />
          </div>

          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Honorarios
              </h2>
              <Link href={`/honorarios/nuevo?causaId=${causa.id}&clienteId=${causa.clienteId}`} className="text-blue-600 text-xs hover:text-blue-700 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {hons.length === 0 ? (
                <p className="px-5 py-4 text-center text-xs text-gray-400">Sin honorarios</p>
              ) : (
                hons.map((h) => {
                  const estadoH = ESTADOS_HONORARIO[h.estado as keyof typeof ESTADOS_HONORARIO]
                  return (
                    <div key={h.id} className="px-5 py-3">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-gray-800 flex-1 truncate pr-2">{h.descripcion}</p>
                        <p className="text-xs font-bold text-gray-900">{formatMonto(h.monto)}</p>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-400">{formatFechaCorta(h.fechaEmision)}</p>
                        <span className={`badge ${estadoH?.color}`}>{estadoH?.label}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
