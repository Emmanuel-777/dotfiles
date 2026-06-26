import { db, initDB } from '@/lib/db'
import { clientes, causas, plazos, honorarios, tareas, actuaciones } from '@/lib/schema'
import {
  formatMonto, formatFechaCorta, formatFechaRelativa,
  estaVencido, esCritico, ESTADOS_CAUSA, ESTADOS_TAREA, PRIORIDADES_TAREA,
  urgenciaTarea, URGENCIA_CLASES,
} from '@/lib/utils'
import Link from 'next/link'
import { Users, Briefcase, Calendar, DollarSign, AlertTriangle, Clock, TrendingUp, CheckCircle, ListTodo, UserCheck, Bell } from 'lucide-react'
import { eq, gte, lte, count, sum, desc, asc, and, inArray, ne, isNotNull } from 'drizzle-orm'
import ReminderButtons from '@/components/ReminderButtons'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await initDB()
  const userId = await requireUserId()

  const hoy = new Date().toISOString()

  const hoyFecha = hoy.split('T')[0]

  const [
    totalClientesRows,
    totalCausasRows,
    causasActivasRows,
    plazosProximosRows,
    honorariosPendientes,
    tareasActivasRows,
    ultimasCausas,
    proximosPlazos,
    proximasTareas,
    recordatoriosPendientes,
  ] = await Promise.all([
    db.select({ count: count() }).from(clientes).where(eq(clientes.userId, userId)),
    db.select({ count: count() }).from(causas).where(eq(causas.userId, userId)),
    db.select({ count: count() }).from(causas).where(and(eq(causas.userId, userId), eq(causas.estado, 'EN_TRAMITE'))),
    db.select({ count: count() }).from(plazos).where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy))),
    db.select({ total: sum(honorarios.monto) }).from(honorarios).where(and(eq(honorarios.userId, userId), inArray(honorarios.estado, ['PENDIENTE', 'PARCIAL']))),
    db.select({ count: count() }).from(tareas).where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'))),
    db.select({ causa: causas, cliente: clientes })
      .from(causas)
      .leftJoin(clientes, eq(causas.clienteId, clientes.id))
      .where(eq(causas.userId, userId))
      .orderBy(desc(causas.createdAt))
      .limit(5),
    db.select({ plazo: plazos, causa: causas, cliente: clientes })
      .from(plazos)
      .leftJoin(causas, eq(plazos.causaId, causas.id))
      .leftJoin(clientes, eq(causas.clienteId, clientes.id))
      .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE')))
      .orderBy(asc(plazos.fecha))
      .limit(8),
    db.select({ tarea: tareas, causa: causas })
      .from(tareas)
      .leftJoin(causas, eq(tareas.causaId, causas.id))
      .where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA')))
      .orderBy(asc(tareas.fechaVencimiento))
      .limit(8),
    db.select({ act: actuaciones, causa: causas, cliente: clientes })
      .from(actuaciones)
      .leftJoin(causas, eq(actuaciones.causaId, causas.id))
      .leftJoin(clientes, eq(causas.clienteId, clientes.id))
      .where(and(
        eq(actuaciones.userId, userId),
        isNotNull(actuaciones.compromiso),
        isNotNull(actuaciones.fechaRecordatorio),
        lte(actuaciones.fechaRecordatorio, hoyFecha),
        eq(actuaciones.recordatorioEnviado, 0),
      ))
      .orderBy(asc(actuaciones.fechaRecordatorio))
      .limit(10),
  ])

  const totalClientes = totalClientesRows[0]?.count ?? 0
  const totalCausas = totalCausasRows[0]?.count ?? 0
  const causasActivas = causasActivasRows[0]?.count ?? 0
  const plazosProximos = plazosProximosRows[0]?.count ?? 0
  const montoPendiente = Number(honorariosPendientes[0]?.total ?? 0)
  const tareasActivas = tareasActivasRows[0]?.count ?? 0

  // Nulls al final en el widget
  const conFecha = proximasTareas.filter((r) => r.tarea.fechaVencimiento)
  const sinFecha = proximasTareas.filter((r) => !r.tarea.fechaVencimiento)
  const tareasOrdenadas = [...conFecha, ...sinFecha]

  const stats = [
    { label: 'Clientes activos',     value: totalClientes,          icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/clientes' },
    { label: 'Causas en trámite',    value: causasActivas,          icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50', href: '/causas',   subtext: `de ${totalCausas} totales` },
    { label: 'Tareas activas',       value: tareasActivas,          icon: ListTodo,  color: 'text-rose-600',   bg: 'bg-rose-50',   href: '/tareas' },
    { label: 'Plazos próximos',      value: plazosProximos,         icon: Calendar,  color: 'text-amber-600',  bg: 'bg-amber-50',  href: '/agenda' },
    { label: 'Honorarios por cobrar',value: formatMonto(montoPendiente), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/honorarios' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu estudio jurídico</p>
      </div>

      {/* Stats — 5 tarjetas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link href={stat.href} key={stat.label} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  {'subtext' in stat && stat.subtext && (
                    <p className="text-xs text-gray-400 mt-0.5">{stat.subtext}</p>
                  )}
                </div>
                <div className={`${stat.bg} rounded-lg p-2`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos plazos */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos plazos
            </h2>
            <Link href="/agenda" className="text-blue-600 text-sm hover:text-blue-700">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {proximosPlazos.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                No hay plazos pendientes
              </div>
            ) : (
              proximosPlazos.map(({ plazo, causa, cliente }) => {
                const vencido = estaVencido(plazo.fecha)
                const critico = esCritico(plazo.fecha)
                return (
                  <div key={plazo.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(vencido || critico) && <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${vencido ? 'text-red-500' : 'text-amber-500'}`} />}
                          <p className="text-sm font-medium text-gray-900 truncate">{plazo.titulo}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {cliente?.nombre} · {causa?.rol}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-medium ${vencido ? 'text-red-600' : critico ? 'text-amber-600' : 'text-gray-600'}`}>
                          {formatFechaRelativa(plazo.fecha)}
                        </p>
                        <p className="text-xs text-gray-400">{formatFechaCorta(plazo.fecha)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Causas recientes */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Causas recientes
            </h2>
            <Link href="/causas" className="text-blue-600 text-sm hover:text-blue-700">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ultimasCausas.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Sin causas registradas</p>
            ) : (
              ultimasCausas.map(({ causa, cliente }) => {
                const estadoInfo = ESTADOS_CAUSA[causa.estado as keyof typeof ESTADOS_CAUSA]
                return (
                  <Link key={causa.id} href={`/causas/${causa.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cliente?.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{causa.rol} · {causa.tipoCausa}</p>
                      <p className="text-xs text-gray-400 truncate">{causa.tribunal}</p>
                    </div>
                    <span className={`badge ml-3 ${estadoInfo?.color}`}>{estadoInfo?.label}</span>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Próximas tareas — todas activas con código de color */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-rose-500" />
              Tareas activas
            </h2>
            <Link href="/tareas" className="text-blue-600 text-sm hover:text-blue-700">Ver todas</Link>
          </div>

          {/* Leyenda mini */}
          <div className="flex items-center gap-3 px-6 py-2 border-b border-gray-50 bg-gray-50 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />A tiempo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />≤ 48 h</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Vencida/hoy</span>
          </div>

          <div className="divide-y divide-gray-50">
            {tareasOrdenadas.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                <ListTodo className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                Sin tareas activas
              </div>
            ) : (
              tareasOrdenadas.map(({ tarea, causa }) => {
                const urgencia = urgenciaTarea(tarea.fechaVencimiento)
                const clases = urgencia ? URGENCIA_CLASES[urgencia] : null
                const estadoT = ESTADOS_TAREA[tarea.estado as keyof typeof ESTADOS_TAREA]
                const prioridadT = PRIORIDADES_TAREA[tarea.prioridad as keyof typeof PRIORIDADES_TAREA]
                return (
                  <Link
                    key={tarea.id}
                    href={`/causas/${tarea.causaId}`}
                    className={[
                      'flex items-start gap-3 px-4 py-3 hover:opacity-90 transition-opacity',
                      clases ? `${clases.border} ${clases.bg}` : 'border-l-4 border-gray-200 bg-white',
                    ].join(' ')}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`badge ${prioridadT?.color}`}>{prioridadT?.label}</span>
                        <p className="text-sm font-medium text-gray-900 truncate">{tarea.titulo}</p>
                        {tarea.esDerivada === 1 && (
                          <UserCheck className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {causa && (
                          <span className="text-xs font-mono text-blue-600">{causa.rol}</span>
                        )}
                        {tarea.asignadoA && (
                          <span className="text-xs text-orange-600 truncate">→ {tarea.asignadoA}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge ${estadoT?.color}`}>{estadoT?.label}</span>
                      {tarea.fechaVencimiento && (
                        <p className={`text-xs mt-1 font-medium ${clases?.texto ?? 'text-gray-400'}`}>
                          {formatFechaCorta(tarea.fechaVencimiento)}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recordatorios pendientes */}
      {recordatoriosPendientes.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50 rounded-t-xl">
            <h2 className="font-semibold text-amber-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              Recordatorios pendientes de enviar
              <span className="ml-1 bg-amber-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {recordatoriosPendientes.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recordatoriosPendientes.map(({ act, causa, cliente }) => (
              <div key={act.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{cliente?.nombre}</p>
                      {causa && (
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{causa.rol}</span>
                      )}
                      {act.fechaRecordatorio && (
                        <span className="text-xs text-amber-700 font-medium">· {formatFechaCorta(act.fechaRecordatorio)}</span>
                      )}
                    </div>
                    <p className="text-sm text-amber-800 mt-1">{act.compromiso}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <ReminderButtons
                    actuacionId={act.id}
                    compromiso={act.compromiso ?? ''}
                    fechaRecordatorio={act.fechaRecordatorio ?? null}
                    recordatorioEnviado={act.recordatorioEnviado}
                    clienteNombre={cliente?.nombre ?? ''}
                    clienteCelular={cliente?.celular ?? null}
                    clienteEmail={cliente?.email ?? null}
                    causaRol={causa?.rol ?? ''}
                    abogado={causa?.abogadoResponsable ?? null}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
