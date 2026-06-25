import { db, initDB } from '@/lib/db'
import { plazos, causas, clientes } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatFechaCorta, estaVencido, esCritico } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const tipoColors: Record<string, string> = {
  AUDIENCIA: 'bg-purple-100 text-purple-800',
  VENCIMIENTO: 'bg-red-100 text-red-800',
  NOTIFICACION: 'bg-blue-100 text-blue-800',
  PRESENTACION: 'bg-orange-100 text-orange-800',
  OTRO: 'bg-gray-100 text-gray-700',
}
const tipoLabels: Record<string, string> = {
  AUDIENCIA: 'Audiencia', VENCIMIENTO: 'Vencimiento',
  NOTIFICACION: 'Notificación', PRESENTACION: 'Presentación', OTRO: 'Otro',
}

export default async function AgendaPage() {
  await initDB()
  const rows = await db
    .select({ plazo: plazos, causa: causas, cliente: clientes })
    .from(plazos)
    .leftJoin(causas, eq(plazos.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .orderBy(asc(plazos.fecha))

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const proximos = rows.filter((r) => r.plazo.estado === 'PENDIENTE' && !estaVencido(r.plazo.fecha))
  const vencidos = rows.filter((r) => r.plazo.estado === 'PENDIENTE' && estaVencido(r.plazo.fecha))
  const completados = rows.filter((r) => r.plazo.estado === 'COMPLETADO')

  const hoy7 = proximos.filter((r) => {
    const diff = new Date(r.plazo.fecha).getTime() - hoy.getTime()
    return diff <= 7 * 24 * 60 * 60 * 1000
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda y Plazos</h1>
          <p className="text-gray-500 text-sm mt-1">{proximos.length} plazos pendientes</p>
        </div>
        <Link href="/agenda/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo plazo
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center border-l-4 border-amber-400">
          <p className="text-3xl font-bold text-amber-600">{hoy7.length}</p>
          <p className="text-sm text-gray-500 mt-1">Esta semana</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-blue-400">
          <p className="text-3xl font-bold text-blue-600">{proximos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pendientes</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-red-400">
          <p className="text-3xl font-bold text-red-600">{vencidos.length}</p>
          <p className="text-sm text-gray-500 mt-1">Vencidos</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-green-400">
          <p className="text-3xl font-bold text-green-600">{completados.length}</p>
          <p className="text-sm text-gray-500 mt-1">Completados</p>
        </div>
      </div>

      {vencidos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Vencidos ({vencidos.length})
          </h2>
          <div className="card overflow-hidden border-l-4 border-red-500">
            <div className="divide-y divide-gray-100">
              {vencidos.map(({ plazo, causa, cliente }) => (
                <PlazoRow key={plazo.id} plazo={plazo} causa={causa} cliente={cliente} tipoColors={tipoColors} tipoLabels={tipoLabels} vencido />
              ))}
            </div>
          </div>
        </div>
      )}

      {proximos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Próximos plazos
          </h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-100">
              {proximos.map(({ plazo, causa, cliente }) => (
                <PlazoRow key={plazo.id} plazo={plazo} causa={causa} cliente={cliente} tipoColors={tipoColors} tipoLabels={tipoLabels} />
              ))}
            </div>
          </div>
        </div>
      )}

      {completados.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Completados ({completados.length})
          </h2>
          <div className="card overflow-hidden opacity-70">
            <div className="divide-y divide-gray-100">
              {completados.slice(0, 5).map(({ plazo, causa, cliente }) => (
                <PlazoRow key={plazo.id} plazo={plazo} causa={causa} cliente={cliente} tipoColors={tipoColors} tipoLabels={tipoLabels} completado />
              ))}
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div className="card py-20 text-center text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No hay plazos registrados</p>
        </div>
      )}
    </div>
  )
}

function PlazoRow({ plazo, causa, cliente, tipoColors, tipoLabels, vencido = false, completado = false }: {
  plazo: any; causa: any; cliente: any; tipoColors: Record<string, string>; tipoLabels: Record<string, string>; vencido?: boolean; completado?: boolean
}) {
  const critico = esCritico(plazo.fecha)
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${vencido ? 'bg-red-50' : critico ? 'bg-amber-50' : 'bg-blue-50'}`}>
          <span className={`text-xs font-bold ${vencido ? 'text-red-600' : critico ? 'text-amber-600' : 'text-blue-600'}`}>
            {new Date(plazo.fecha).getDate()}
          </span>
          <span className={`text-[10px] ${vencido ? 'text-red-400' : 'text-gray-400'}`}>
            {new Date(plazo.fecha).toLocaleString('es', { month: 'short' }).toUpperCase()}
          </span>
        </div>
        <div>
          <p className={`text-sm font-semibold ${completado ? 'line-through text-gray-400' : 'text-gray-900'}`}>{plazo.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{cliente?.nombre} · ROL {causa?.rol}</p>
          {plazo.notas && <p className="text-xs text-gray-400 mt-0.5">{plazo.notas}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`badge ${tipoColors[plazo.tipo] || tipoColors.OTRO}`}>{tipoLabels[plazo.tipo] || plazo.tipo}</span>
        <Link href={`/causas/${plazo.causaId}`} className="text-xs text-blue-600 hover:text-blue-700">Ver causa</Link>
      </div>
    </div>
  )
}
