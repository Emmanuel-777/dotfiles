import { db, initDB } from '@/lib/db'
import { clientes, causas, plazos, honorarios, tareas, actuaciones } from '@/lib/schema'
import {
  formatMonto, formatFechaCorta, formatFechaHoraChile, formatFechaRelativa,
  estaVencido, esCritico, esCriticoPrescripcion, ESTADOS_CAUSA, ESTADOS_TAREA, PRIORIDADES_TAREA,
  urgenciaTarea, URGENCIA_CLASES, hoyChile,
} from '@/lib/utils'
import Link from 'next/link'
import { Users, Briefcase, Calendar, DollarSign, AlertTriangle, Clock, TrendingUp, CheckCircle, ListTodo, UserCheck, Bell, UserPlus, FilePlus, CalendarPlus, Receipt, ArrowRight } from 'lucide-react'
import { eq, gte, lte, lt, count, sum, desc, asc, and, inArray, ne, isNotNull } from 'drizzle-orm'
import ReminderButtons from '@/components/ReminderButtons'
import EmptyState from '@/components/EmptyState'
import { requireUserId } from '@/lib/auth'

const QUICK_ACTIONS = [
  { label: 'Nuevo cliente', href: '/clientes/nuevo', icon: UserPlus,     color: 'text-blue-600',    bg: 'bg-blue-50 hover:bg-blue-100' },
  { label: 'Nueva causa',   href: '/causas/nueva',   icon: Briefcase,    color: 'text-violet-600',  bg: 'bg-violet-50 hover:bg-violet-100' },
  { label: 'Nueva cita',    href: '/citas/nueva',    icon: CalendarPlus, color: 'text-cyan-600',    bg: 'bg-cyan-50 hover:bg-cyan-100' },
  { label: 'Nuevo plazo',   href: '/agenda/nuevo',   icon: Calendar,     color: 'text-amber-600',   bg: 'bg-amber-50 hover:bg-amber-100' },
  { label: 'Nuevo honorario', href: '/honorarios/nuevo', icon: Receipt,  color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
  { label: 'Nuevo documento', href: '/documentos/nuevo', icon: FilePlus, color: 'text-rose-600',    bg: 'bg-rose-50 hover:bg-rose-100' },
]

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await initDB()
  const userId = await requireUserId()

  const hoy = new Date().toISOString()

  // Hoy real de Chile (no el del servidor, que corre en UTC) — usado para
  // comparaciones día-a-día como los recordatorios de compromiso.
  const hoyFecha = hoyChile()

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
    plazosVencidosRows,
    tareasVencidasRows,
    causasPenalesRows,
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
        lte(actuaciones.fechaRecordatorio, `${hoyFecha}T23:59:59.999Z`),
        eq(actuaciones.recordatorioEnviado, 0),
      ))
      .orderBy(asc(actuaciones.fechaRecordatorio))
      .limit(10),
    db.select({ count: count() }).from(plazos).where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), lt(plazos.fecha, hoy))),
    db.select({ count: count() }).from(tareas).where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'), isNotNull(tareas.fechaVencimiento), lt(tareas.fechaVencimiento, hoy))),
    db.select({ id: causas.id, rol: causas.rol, fechaPrescripcion: causas.fechaPrescripcion })
      .from(causas)
      .where(and(eq(causas.userId, userId), eq(causas.tipoCausa, 'Penal'), isNotNull(causas.fechaPrescripcion))),
  ])

  const plazosVencidos = plazosVencidosRows[0]?.count ?? 0
  const tareasVencidas = tareasVencidasRows[0]?.count ?? 0
  const totalVencidos = plazosVencidos + tareasVencidas

  const totalClientes = totalClientesRows[0]?.count ?? 0
  const totalCausas = totalCausasRows[0]?.count ?? 0
  const causasActivas = causasActivasRows[0]?.count ?? 0
  const plazosProximos = plazosProximosRows[0]?.count ?? 0
  const montoPendiente = Number(honorariosPendientes[0]?.total ?? 0)
  const tareasActivas = tareasActivasRows[0]?.count ?? 0

  const causasPenalesProximas = causasPenalesRows
    .filter((c) => c.fechaPrescripcion && esCriticoPrescripcion(c.fechaPrescripcion))
    .sort((a, b) => (a.fechaPrescripcion! < b.fechaPrescripcion! ? -1 : 1))

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
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu estudio jurídico</p>
      </div>

      {/* Banner de alertas — vencimientos */}
      {totalVencidos > 0 && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">
              Tienes {totalVencidos} {totalVencidos === 1 ? 'asunto vencido' : 'asuntos vencidos'} que requieren atención
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {plazosVencidos > 0 && `${plazosVencidos} plazo${plazosVencidos === 1 ? '' : 's'}`}
              {plazosVencidos > 0 && tareasVencidas > 0 && ' · '}
              {tareasVencidas > 0 && `${tareasVencidas} tarea${tareasVencidas === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            {plazosVencidos > 0 && (
              <Link href="/agenda" className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                Ver plazos <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {tareasVencidas > 0 && (
              <Link href="/tareas" className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                Ver tareas <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Alerta — causas penales próximas a prescribir */}
      {causasPenalesProximas.length > 0 && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {causasPenalesProximas.length} {causasPenalesProximas.length === 1 ? 'causa penal se acerca' : 'causas penales se acercan'} a su fecha de prescripción
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Revisa si corresponde eliminar los datos conforme a la Ley 21.719 (Arts. 24-25) — {causasPenalesProximas.slice(0, 3).map((c) => c.rol).join(', ')}
              {causasPenalesProximas.length > 3 && '…'}
            </p>
          </div>
          <Link href="/causas" className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex-shrink-0">
            Ver causas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="mb-8 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ${action.color} ${action.bg} transition-colors`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Link>
          )
        })}
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
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos plazos
              {proximosPlazos.length > 0 && (
                <span className="ml-1 text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                  {plazosProximos}
                </span>
              )}
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
                const accentColor = vencido ? 'border-l-red-500 bg-red-50/50' : critico ? 'border-l-amber-400 bg-amber-50/30' : 'border-l-gray-200'
                return (
                  <Link
                    key={plazo.id}
                    href="/agenda"
                    className={`flex items-start justify-between gap-3 px-6 py-3 border-l-4 hover:brightness-95 transition-all ${accentColor}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {(vencido || critico) && (
                          <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${vencido ? 'text-red-500' : 'text-amber-500'}`} />
                        )}
                        <p className="text-sm font-medium text-gray-900 truncate">{plazo.titulo}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {cliente?.nombre}
                        {causa?.rol && <span className="font-mono text-blue-600 ml-1">· {causa.rol}</span>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                        vencido ? 'bg-red-100 text-red-700' : critico ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {formatFechaRelativa(plazo.fecha)}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{formatFechaCorta(plazo.fecha)}</p>
                    </div>
                  </Link>
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
              <EmptyState
                icon={Briefcase}
                title="Sin causas registradas"
                description="Crea tu primera causa para empezar a gestionar tu cartera."
                actionLabel="Nueva causa"
                actionHref="/causas/nueva"
                compact
              />
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
                          {formatFechaHoraChile(tarea.fechaVencimiento)}
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
                        <span className="text-xs text-amber-700 font-medium">· {formatFechaHoraChile(act.fechaRecordatorio)}</span>
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
