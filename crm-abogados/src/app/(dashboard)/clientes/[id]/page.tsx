import { db, initDB } from '@/lib/db'
import { clientes, causas, honorarios, tareas, asesorias } from '@/lib/schema'
import { eq, and, asc, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Phone, Mail, MapPin, Briefcase, DollarSign, Plus, FileText, ListTodo, AlertTriangle, Clock, Download, NotebookPen } from 'lucide-react'
import { formatMonto, formatFechaCorta, ESTADOS_CAUSA, ESTADOS_HONORARIO, ESTADOS_TAREA, PRIORIDADES_TAREA, urgenciaTarea, URGENCIA_CLASES } from '@/lib/utils'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  await initDB()
  const userId = await requireUserId()
  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
  if (!cliente) notFound()

  const [clienteCausas, clienteHonorarios, clienteTareas, clienteAsesorias] = await Promise.all([
    db.select().from(causas).where(and(eq(causas.clienteId, params.id), eq(causas.userId, userId))),
    db.select().from(honorarios).where(and(eq(honorarios.clienteId, params.id), eq(honorarios.userId, userId))),
    db.select().from(tareas).where(and(eq(tareas.clienteId, params.id), eq(tareas.userId, userId))).orderBy(asc(tareas.fechaVencimiento)),
    db.select().from(asesorias).where(and(eq(asesorias.clienteId, params.id), eq(asesorias.userId, userId))).orderBy(desc(asesorias.fecha)),
  ])

  const totalPagado = clienteHonorarios.filter((h) => h.estado === 'PAGADO').reduce((s, h) => s + h.monto, 0)
  const totalPendiente = clienteHonorarios.filter((h) => h.estado === 'PENDIENTE' || h.estado === 'PARCIAL').reduce((s, h) => s + h.monto, 0)

  return (
    <div className="p-4 lg:p-8">
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
              <div className="flex items-center gap-2">
                <Link href={`/clientes/${cliente.id}/reporte`} className="btn-secondary flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Reporte
                </Link>
                <a
                  href={`/api/clientes/${cliente.id}/exportar`}
                  className="btn-secondary flex items-center gap-1.5"
                  title="Descarga todos los datos de este cliente en formato JSON"
                >
                  <Download className="h-4 w-4" />
                  Exportar todos los datos
                </a>
                <Link href={`/clientes/${cliente.id}/editar`} className="btn-secondary">Editar</Link>
              </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                  <Link key={h.id} href={`/honorarios/${h.id}/editar`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.descripcion}</p>
                      <p className="text-xs text-gray-500">{formatFechaCorta(h.fechaEmision)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatMonto(h.monto)}</p>
                      <span className={`badge ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Tareas */}
      <div className="card mt-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-violet-500" />
            Tareas ({clienteTareas.length})
          </h2>
          <Link href={`/clientes/${cliente.id}/tareas/nueva`} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Nueva tarea
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {clienteTareas.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-gray-400">Sin tareas</p>
          ) : (
            clienteTareas.map((t) => {
              const urgencia = urgenciaTarea(t.fechaVencimiento)
              const clases = urgencia ? URGENCIA_CLASES[urgencia] : null
              const estadoT = ESTADOS_TAREA[t.estado as keyof typeof ESTADOS_TAREA]
              const prioridadT = PRIORIDADES_TAREA[t.prioridad as keyof typeof PRIORIDADES_TAREA]
              const causa = clienteCausas.find((c) => c.id === t.causaId)
              return (
                <div key={t.id} className={`flex items-center justify-between px-6 py-3 ${clases ? `${clases.bg}` : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${prioridadT?.color}`}>{prioridadT?.label}</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{t.titulo}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      {causa && (
                        <Link href={`/causas/${causa.id}`} className="font-mono text-blue-600 hover:text-blue-700">{causa.rol}</Link>
                      )}
                      {t.fechaVencimiento && (
                        <span className={`flex items-center gap-1 ${clases?.texto ?? ''}`}>
                          {urgencia === 'roja' && <AlertTriangle className="h-3 w-3" />}
                          {urgencia === 'amarilla' && <Clock className="h-3 w-3" />}
                          {formatFechaCorta(t.fechaVencimiento)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 ml-3 ${estadoT?.color}`}>{estadoT?.label}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Bitácora de Asesoría */}
      <div className="card mt-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-blue-500" />
            Bitácora de Asesoría ({clienteAsesorias.length})
          </h2>
          <Link href={`/clientes/${cliente.id}/asesoria/nueva`} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Agregar
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {clienteAsesorias.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-gray-400">Sin registros de asesoría</p>
          ) : (
            clienteAsesorias.map((a) => (
              <div key={a.id} className="px-6 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-blue-50 text-blue-700 text-[10px]">{a.tipo}</span>
                      <span className="text-xs text-gray-400">{formatFechaCorta(a.fecha)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{a.descripcion}</p>
                    {a.archivoUrl && (
                      <a
                        href={`/api/asesorias/download?url=${encodeURIComponent(a.archivoUrl)}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Download className="h-3 w-3" />
                        {a.archivoNombre || 'Descargar'}
                      </a>
                    )}
                  </div>
                  <Link href={`/clientes/${cliente.id}/asesoria/${a.id}/editar`} className="flex-shrink-0 text-xs text-gray-400 hover:text-blue-600">
                    Editar
                  </Link>
                </div>
              </div>
            ))
          )}
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
