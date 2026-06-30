import { db, initDB } from '@/lib/db'
import { citas, clientes, prospectos, causas } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { requireUserId } from '@/lib/auth'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, CalendarPlus, Video, MapPin, Phone,
  User, Briefcase, Clock, DollarSign, FileText, CheckCircle,
  ExternalLink, MessageCircle,
} from 'lucide-react'
import { formatMonto } from '@/lib/utils'
import CitaEstadoSelect from '@/components/CitaEstadoSelect'

export const dynamic = 'force-dynamic'

const TIPO_ICONS: Record<string, React.ReactNode> = {
  PRESENCIAL:  <MapPin className="h-4 w-4" />,
  MEET:        <Video className="h-4 w-4 text-blue-500" />,
  ZOOM:        <Video className="h-4 w-4 text-purple-500" />,
  TELEFONICA:  <Phone className="h-4 w-4 text-green-500" />,
}
const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial', MEET: 'Google Meet', ZOOM: 'Zoom', TELEFONICA: 'Telefónica',
}

function buildGoogleCalendarUrl(cita: {
  titulo: string; descripcion: string | null; fecha: string
  horaInicio: string; horaFin: string | null; linkReunion: string | null; tipo: string
}) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const toDateTime = (fecha: string, hora: string) => {
    const [y, m, d] = fecha.split('-').map(Number)
    const [h, min] = hora.split(':').map(Number)
    return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`
  }
  const finHora = cita.horaFin ?? `${String(Number(cita.horaInicio.split(':')[0]) + 1).padStart(2, '0')}:00`
  const start = toDateTime(cita.fecha, cita.horaInicio)
  const end   = toDateTime(cita.fecha, finHora)
  const location = cita.linkReunion ?? ''
  const details  = [cita.descripcion, cita.linkReunion ? `Enlace: ${cita.linkReunion}` : ''].filter(Boolean).join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: cita.titulo,
    dates: `${start}/${end}`,
    details,
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildWhatsAppUrl(telefono: string, mensaje: string) {
  const digits = telefono.replace(/\D/g, '')
  const conCodigo = digits.startsWith('56') ? digits : `56${digits.replace(/^0+/, '')}`
  return `https://wa.me/${conCodigo}?text=${encodeURIComponent(mensaje)}`
}

export default async function CitaDetailPage({ params }: { params: { id: string } }) {
  await initDB()
  const userId = await requireUserId()
  const rows = await db
    .select({ cita: citas, cliente: clientes, prospecto: prospectos, causa: causas })
    .from(citas)
    .leftJoin(clientes, eq(citas.clienteId, clientes.id))
    .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
    .leftJoin(causas, eq(citas.causaId, causas.id))
    .where(and(eq(citas.id, params.id), eq(citas.userId, userId)))
    .limit(1)

  if (!rows.length) notFound()
  const { cita, cliente, prospecto, causa } = rows[0]

  const googleCalUrl = buildGoogleCalendarUrl(cita)

  const fechaFormateada = new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const contactoNombre = cliente?.nombre ?? prospecto?.nombre
  const contactoTelefono = cliente?.celular || cliente?.telefono || prospecto?.telefono
  const whatsappUrl = contactoTelefono
    ? buildWhatsAppUrl(
        contactoTelefono,
        `Hola ${contactoNombre}, te confirmo tu cita "${cita.titulo}" el ${fechaFormateada} a las ${cita.horaInicio}hrs.${cita.linkReunion ? ` Enlace: ${cita.linkReunion}` : ''}`,
      )
    : null

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <Link href="/citas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a citas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              {TIPO_ICONS[cita.tipo]}
              {TIPO_LABELS[cita.tipo] ?? cita.tipo}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{cita.titulo}</h1>
        </div>
        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-1.5 text-sm"
              title={`Enviar WhatsApp a ${contactoNombre}`}
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp
            </a>
          )}
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-1.5 text-sm"
            title="Agregar al Google Calendar"
          >
            <CalendarPlus className="h-4 w-4 text-blue-600" />
            Google Calendar
          </a>
          <Link href={`/citas/${cita.id}/editar`} className="btn-secondary flex items-center gap-1.5">
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4">

          {/* Fecha y hora */}
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fecha y hora</h2>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-blue-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600 leading-none">
                  {new Date(cita.fecha + 'T00:00:00').getDate()}
                </span>
                <span className="text-xs uppercase text-blue-400 font-medium">
                  {new Date(cita.fecha + 'T00:00:00').toLocaleString('es', { month: 'short' })}
                </span>
                <span className="text-xs text-blue-300">
                  {new Date(cita.fecha + 'T00:00:00').getFullYear()}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 capitalize">{fechaFormateada}</p>
                <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                  <Clock className="h-4 w-4" />
                  {cita.horaInicio}{cita.horaFin ? ` – ${cita.horaFin}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Enlace de reunión */}
          {cita.linkReunion && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Enlace de reunión</h2>
              <a
                href={cita.linkReunion}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline break-all"
              >
                {TIPO_ICONS[cita.tipo]}
                <span className="text-sm font-mono">{cita.linkReunion}</span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Descripción */}
          {cita.descripcion && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descripción</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{cita.descripcion}</p>
            </div>
          )}

          {/* Notas */}
          {cita.notas && (
            <div className="card p-5 border-l-4 border-yellow-300">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Notas internas
              </h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{cita.notas}</p>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          {/* Estado */}
          <div className="card p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estado</h2>
            <CitaEstadoSelect citaId={cita.id} estadoActual={cita.estado} />
          </div>

          {/* Cobro */}
          <div className="card p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Cobro
            </h2>
            {cita.esGratuita ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Consulta gratuita</span>
              </div>
            ) : cita.valor ? (
              <p className="text-xl font-bold text-emerald-600">{formatMonto(cita.valor)}</p>
            ) : (
              <p className="text-sm text-gray-400">Sin valor definido</p>
            )}
          </div>

          {/* Cliente */}
          {cliente && (
            <div className="card p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Cliente
              </h2>
              <Link href={`/clientes/${cliente.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {cliente.nombre}
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">{cliente.rut}</p>
            </div>
          )}

          {/* Prospecto */}
          {prospecto && (
            <div className="card p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Prospecto
              </h2>
              <Link href={`/embudo/${prospecto.id}/editar`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {prospecto.nombre}
              </Link>
              {prospecto.empresa && <p className="text-xs text-gray-400 mt-0.5">{prospecto.empresa}</p>}
            </div>
          )}

          {/* Causa */}
          {causa && (
            <div className="card p-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Causa
              </h2>
              <Link href={`/causas/${causa.id}`} className="text-sm font-mono font-medium text-blue-600 hover:text-blue-700">
                {causa.rol}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
