import { db, initDB } from '@/lib/db'
import { citas, clientes, prospectos, causas } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import Link from 'next/link'
import { requireUserId } from '@/lib/auth'
import {
  Plus, CalendarDays, Video, Phone, MapPin, Clock,
  DollarSign, CheckCircle, XCircle, AlertCircle, User,
} from 'lucide-react'
import { formatMonto } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const TIPO_ICONS: Record<string, React.ReactNode> = {
  PRESENCIAL: <MapPin className="h-3.5 w-3.5" />,
  MEET:  <Video className="h-3.5 w-3.5" />,
  ZOOM:  <Video className="h-3.5 w-3.5" />,
  TELEFONICA: <Phone className="h-3.5 w-3.5" />,
}
const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial', MEET: 'Google Meet', ZOOM: 'Zoom', TELEFONICA: 'Telefónica',
}
const TIPO_COLORS: Record<string, string> = {
  PRESENCIAL: 'bg-slate-100 text-slate-700',
  MEET:       'bg-blue-100 text-blue-700',
  ZOOM:       'bg-purple-100 text-purple-700',
  TELEFONICA: 'bg-green-100 text-green-700',
}
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
  CONFIRMADA: 'bg-blue-100 text-blue-800',
  COMPLETADA: 'bg-green-100 text-green-800',
  CANCELADA:  'bg-gray-100 text-gray-600',
}
const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', COMPLETADA: 'Completada', CANCELADA: 'Cancelada',
}

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function esPasada(fecha: string, hora: string) {
  const dt = new Date(`${fecha}T${hora}:00`)
  return dt < new Date()
}

export default async function CitasPage() {
  await initDB()
  const userId = await requireUserId()
  const rows = await db
    .select({ cita: citas, cliente: clientes, prospecto: prospectos, causa: causas })
    .from(citas)
    .leftJoin(clientes, eq(citas.clienteId, clientes.id))
    .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
    .leftJoin(causas, eq(citas.causaId, causas.id))
    .where(eq(citas.userId, userId))
    .orderBy(desc(citas.fecha))

  const proximas  = rows.filter((r) => r.cita.estado !== 'CANCELADA' && r.cita.estado !== 'COMPLETADA' && !esPasada(r.cita.fecha, r.cita.horaInicio))
  const pasadas   = rows.filter((r) => r.cita.estado === 'COMPLETADA' || (r.cita.estado !== 'CANCELADA' && esPasada(r.cita.fecha, r.cita.horaInicio)))
  const canceladas = rows.filter((r) => r.cita.estado === 'CANCELADA')

  // Estadísticas
  const totalValor = rows
    .filter((r) => !r.cita.esGratuita && r.cita.valor && r.cita.estado !== 'CANCELADA')
    .reduce((s, r) => s + (r.cita.valor ?? 0), 0)

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas y Consultas</h1>
          <p className="text-gray-500 text-sm mt-1">{proximas.length} citas próximas</p>
        </div>
        <Link href="/citas/nueva" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva cita
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center border-l-4 border-blue-400">
          <p className="text-3xl font-bold text-blue-600">{proximas.length}</p>
          <p className="text-sm text-gray-500 mt-1">Próximas</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-green-400">
          <p className="text-3xl font-bold text-green-600">{pasadas.filter((r) => r.cita.estado === 'COMPLETADA').length}</p>
          <p className="text-sm text-gray-500 mt-1">Completadas</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-gray-300">
          <p className="text-3xl font-bold text-gray-600">{canceladas.length}</p>
          <p className="text-sm text-gray-500 mt-1">Canceladas</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-emerald-400">
          <p className="text-2xl font-bold text-emerald-600">{formatMonto(totalValor)}</p>
          <p className="text-sm text-gray-500 mt-1">Total cobrado</p>
        </div>
      </div>

      {/* Próximas */}
      {proximas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Próximas citas
          </h2>
          <div className="space-y-3">
            {proximas.map(({ cita, cliente, prospecto, causa }) => (
              <CitaCard key={cita.id} cita={cita} cliente={cliente} prospecto={prospecto} causa={causa} />
            ))}
          </div>
        </section>
      )}

      {/* Historial */}
      {pasadas.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Historial ({pasadas.length})
          </h2>
          <div className="space-y-2 opacity-75">
            {pasadas.map(({ cita, cliente, prospecto, causa }) => (
              <CitaCard key={cita.id} cita={cita} cliente={cliente} prospecto={prospecto} causa={causa} muted />
            ))}
          </div>
        </section>
      )}

      {canceladas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Canceladas ({canceladas.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {canceladas.map(({ cita, cliente, prospecto, causa }) => (
              <CitaCard key={cita.id} cita={cita} cliente={cliente} prospecto={prospecto} causa={causa} muted />
            ))}
          </div>
        </section>
      )}

      {rows.length === 0 && (
        <div className="card py-20 text-center text-gray-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No hay citas registradas</p>
          <p className="text-sm mt-1">Crea la primera cita con el botón "Nueva cita"</p>
        </div>
      )}
    </div>
  )
}

function CitaCard({ cita, cliente, prospecto, causa, muted = false }: {
  cita: any; cliente: any; prospecto: any; causa: any; muted?: boolean
}) {
  const tipoColor = TIPO_COLORS[cita.tipo] ?? 'bg-gray-100 text-gray-700'
  const estadoColor = ESTADO_COLORS[cita.estado] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link href={`/citas/${cita.id}`} className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow">
      {/* Fecha bloque */}
      <div className={`h-14 w-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${muted ? 'bg-gray-100' : 'bg-blue-50'}`}>
        <span className={`text-lg font-bold leading-none ${muted ? 'text-gray-500' : 'text-blue-600'}`}>
          {new Date(cita.fecha + 'T00:00:00').getDate()}
        </span>
        <span className={`text-[10px] uppercase font-medium ${muted ? 'text-gray-400' : 'text-blue-400'}`}>
          {new Date(cita.fecha + 'T00:00:00').toLocaleString('es', { month: 'short' })}
        </span>
        <span className={`text-[10px] ${muted ? 'text-gray-400' : 'text-blue-400'}`}>
          {new Date(cita.fecha + 'T00:00:00').getFullYear()}
        </span>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold truncate ${muted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{cita.titulo}</p>
          <span className={`badge ${tipoColor} flex items-center gap-1`}>
            {TIPO_ICONS[cita.tipo]}
            {TIPO_LABELS[cita.tipo] ?? cita.tipo}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {cita.horaInicio}{cita.horaFin ? ` – ${cita.horaFin}` : ''}
          </span>
          {(cliente || prospecto) && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              {cliente ? cliente.nombre : `${prospecto.nombre} (prospecto)`}
            </span>
          )}
          {causa && (
            <span className="text-xs font-mono text-blue-600">{causa.rol}</span>
          )}
        </div>
      </div>

      {/* Derecha */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`badge ${estadoColor}`}>{ESTADO_LABELS[cita.estado] ?? cita.estado}</span>
        {cita.esGratuita ? (
          <span className="text-xs text-green-600 font-medium">Gratuita</span>
        ) : cita.valor ? (
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />
            {formatMonto(cita.valor)}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
