import { db, initDB } from '@/lib/db'
import { tareas, causas, clientes } from '@/lib/schema'
import {
  formatFechaCorta,
  formatFechaRelativa,
  ESTADOS_TAREA,
  PRIORIDADES_TAREA,
  urgenciaTarea,
  URGENCIA_CLASES,
} from '@/lib/utils'
import Link from 'next/link'
import { eq, asc, desc } from 'drizzle-orm'
import { ListTodo, UserCheck, KeyRound, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import TareaEstadoSelect from '@/components/TareaEstadoSelect'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TareasPage() {
  await initDB()
  const userId = await requireUserId()

  const rows = await db
    .select({ tarea: tareas, causa: causas, cliente: clientes })
    .from(tareas)
    .leftJoin(causas, eq(tareas.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(tareas.userId, userId))
    .orderBy(asc(tareas.fechaVencimiento), desc(tareas.createdAt))

  // Nulls al final (SQLite pone NULLs primero en ASC)
  const conFecha = rows.filter((r) => r.tarea.fechaVencimiento)
  const sinFecha = rows.filter((r) => !r.tarea.fechaVencimiento)
  const todas = [...conFecha, ...sinFecha]

  const activas = todas.filter((r) => !['COMPLETADA', 'CANCELADA'].includes(r.tarea.estado))
  const historial = todas.filter((r) => ['COMPLETADA', 'CANCELADA'].includes(r.tarea.estado))

  const totalPendientes = activas.filter((r) => r.tarea.estado === 'PENDIENTE').length
  const totalDerivadas = activas.filter((r) => r.tarea.esDerivada === 1).length
  const totalVencidas = activas.filter((r) => urgenciaTarea(r.tarea.fechaVencimiento) === 'roja').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-violet-600" />
            Tareas
          </h1>
          <p className="text-gray-500 text-sm mt-1">Consolidado de todas las causas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activas.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Activas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{totalPendientes}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pendientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{totalDerivadas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Derivadas</p>
        </div>
        <div className="card p-4 text-center border border-red-200">
          <p className="text-2xl font-bold text-red-600">{totalVencidas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Vencidas o hoy</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 mb-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
          A tiempo (más de 48 h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" />
          Vence en ≤ 48 h
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          Vencida o vence hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-300" />
          Sin fecha límite
        </span>
      </div>

      {/* Lista de tareas activas */}
      {activas.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" />
          <p className="text-gray-500 font-medium">No hay tareas activas</p>
          <p className="text-gray-400 text-sm mt-1">Las tareas se crean desde el detalle de cada causa</p>
        </div>
      ) : (
        <div className="space-y-3 mb-10">
          {activas.map(({ tarea, causa, cliente }) => {
            const urgencia = urgenciaTarea(tarea.fechaVencimiento)
            const clases = urgencia ? URGENCIA_CLASES[urgencia] : null
            const estadoT = ESTADOS_TAREA[tarea.estado as keyof typeof ESTADOS_TAREA]
            const prioridadT = PRIORIDADES_TAREA[tarea.prioridad as keyof typeof PRIORIDADES_TAREA]
            const creds = tarea.credencialesPortal ? JSON.parse(tarea.credencialesPortal) : null

            return (
              <div
                key={tarea.id}
                className={[
                  'block rounded-lg overflow-hidden shadow-sm',
                  clases ? `${clases.border} ${clases.bg}` : 'border-l-4 border-gray-200 bg-white',
                ].join(' ')}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Izquierda */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`badge ${prioridadT?.color}`}>{prioridadT?.label}</span>
                        <Link href={`/causas/${tarea.causaId}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {tarea.titulo}
                        </Link>
                        {tarea.esDerivada === 1 && (
                          <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Derivada
                          </span>
                        )}
                      </div>

                      {tarea.descripcion && (
                        <p className="text-xs text-gray-500 mb-1.5 truncate">{tarea.descripcion}</p>
                      )}

                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        {causa && (
                          <Link href={`/causas/${tarea.causaId}`} className="font-mono font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100">
                            {causa.rol}
                          </Link>
                        )}
                        {cliente && <span>{cliente.nombre}</span>}
                        {tarea.asignadoA && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <UserCheck className="h-3 w-3" />
                            {tarea.asignadoA}
                          </span>
                        )}
                        {creds?.sistema && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <KeyRound className="h-3 w-3" />
                            {creds.sistema}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Derecha */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <TareaEstadoSelect tareaId={tarea.id} estadoActual={tarea.estado} />

                      {tarea.fechaVencimiento ? (
                        <div className={`text-right ${clases?.texto ?? 'text-gray-500'}`}>
                          <div className="flex items-center gap-1 justify-end text-xs font-semibold">
                            {urgencia === 'roja' && <AlertTriangle className="h-3.5 w-3.5" />}
                            {urgencia === 'amarilla' && <Clock className="h-3.5 w-3.5" />}
                            {formatFechaRelativa(tarea.fechaVencimiento)}
                          </div>
                          <p className="text-xs opacity-75">{formatFechaCorta(tarea.fechaVencimiento)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Sin fecha límite</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Historial ({historial.length})
          </h2>
          <div className="space-y-2">
            {historial.map(({ tarea, causa, cliente }) => {
              const estadoT = ESTADOS_TAREA[tarea.estado as keyof typeof ESTADOS_TAREA]
              const prioridadT = PRIORIDADES_TAREA[tarea.prioridad as keyof typeof PRIORIDADES_TAREA]
              return (
                <Link
                  key={tarea.id}
                  href={`/causas/${tarea.causaId}`}
                  className="block bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors opacity-70"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${prioridadT?.color}`}>{prioridadT?.label}</span>
                      <span className="text-sm text-gray-600 line-through">{tarea.titulo}</span>
                      {causa && (
                        <span className="text-xs font-mono text-gray-400">{causa.rol}</span>
                      )}
                      {cliente && <span className="text-xs text-gray-400">{cliente.nombre}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${estadoT?.color}`}>{estadoT?.label}</span>
                      {tarea.fechaVencimiento && (
                        <span className="text-xs text-gray-400">{formatFechaCorta(tarea.fechaVencimiento)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
