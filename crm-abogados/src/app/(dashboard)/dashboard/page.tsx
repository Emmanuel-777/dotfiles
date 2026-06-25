import { db, initDB } from '@/lib/db'
import { clientes, causas, plazos, honorarios } from '@/lib/schema'
import { formatMonto, formatFechaCorta, formatFechaRelativa, estaVencido, esCritico, ESTADOS_CAUSA } from '@/lib/utils'
import Link from 'next/link'
import { Users, Briefcase, Calendar, DollarSign, AlertTriangle, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import { eq, gte, count, sum, desc, asc, and, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await initDB()

  const hoy = new Date().toISOString()

  const [
    totalClientesRows,
    totalCausasRows,
    causasActivasRows,
    plazosProximosRows,
    honorariosPendientes,
    ultimasCausas,
    proximosPlazos,
  ] = await Promise.all([
    db.select({ count: count() }).from(clientes),
    db.select({ count: count() }).from(causas),
    db.select({ count: count() }).from(causas).where(eq(causas.estado, 'EN_TRAMITE')),
    db.select({ count: count() }).from(plazos).where(and(eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy))),
    db.select({ total: sum(honorarios.monto) }).from(honorarios).where(inArray(honorarios.estado, ['PENDIENTE', 'PARCIAL'])),
    db.select({ causa: causas, cliente: clientes })
      .from(causas)
      .leftJoin(clientes, eq(causas.clienteId, clientes.id))
      .orderBy(desc(causas.createdAt))
      .limit(5),
    db.select({ plazo: plazos, causa: causas, cliente: clientes })
      .from(plazos)
      .leftJoin(causas, eq(plazos.causaId, causas.id))
      .leftJoin(clientes, eq(causas.clienteId, clientes.id))
      .where(eq(plazos.estado, 'PENDIENTE'))
      .orderBy(asc(plazos.fecha))
      .limit(8),
  ])

  const totalClientes = totalClientesRows[0]?.count ?? 0
  const totalCausas = totalCausasRows[0]?.count ?? 0
  const causasActivas = causasActivasRows[0]?.count ?? 0
  const plazosProximos = plazosProximosRows[0]?.count ?? 0
  const montoPendiente = Number(honorariosPendientes[0]?.total ?? 0)

  const stats = [
    { label: 'Clientes activos', value: totalClientes, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/clientes' },
    { label: 'Causas en trámite', value: causasActivas, subtext: `de ${totalCausas} totales`, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50', href: '/causas' },
    { label: 'Plazos próximos', value: plazosProximos, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', href: '/agenda' },
    { label: 'Honorarios por cobrar', value: formatMonto(montoPendiente), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/honorarios' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu estudio jurídico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link href={stat.href} key={stat.label} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  {stat.subtext && <p className="text-xs text-gray-400 mt-0.5">{stat.subtext}</p>}
                </div>
                <div className={`${stat.bg} rounded-lg p-2.5`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {ultimasCausas.map(({ causa, cliente }) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
