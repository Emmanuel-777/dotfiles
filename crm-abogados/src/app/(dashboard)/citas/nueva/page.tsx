'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Video, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'

const TIPOS = [
  { value: 'PRESENCIAL', label: 'Presencial', icon: <MapPin className="h-4 w-4" /> },
  { value: 'MEET',       label: 'Google Meet', icon: <Video className="h-4 w-4 text-blue-500" /> },
  { value: 'ZOOM',       label: 'Zoom',        icon: <Video className="h-4 w-4 text-purple-500" /> },
  { value: 'TELEFONICA', label: 'Telefónica',  icon: <Phone className="h-4 w-4 text-green-500" /> },
]

export default function NuevaCitaPage() {
  return (
    <Suspense>
      <NuevaCitaForm />
    </Suspense>
  )
}

function NuevaCitaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string; rut: string }[]>([])
  const [causas, setCausas] = useState<{ id: string; rol: string; clienteId: string }[]>([])
  const [causasFiltradas, setCausasFiltradas] = useState<typeof causas>([])

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    clienteId: searchParams.get('clienteId') ?? '',
    causaId: searchParams.get('causaId') ?? '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    horaFin: '10:00',
    tipo: 'PRESENCIAL',
    linkReunion: '',
    esGratuita: false,
    valor: '',
    estado: 'PENDIENTE',
    notas: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/clientes').then((r) => r.json()),
      fetch('/api/causas').then((r) => r.json()),
    ]).then(([c, ca]) => {
      setClientes(c)
      setCausas(ca)
    })
  }, [])

  useEffect(() => {
    if (form.clienteId) {
      setCausasFiltradas(causas.filter((c) => c.clienteId === form.clienteId))
    } else {
      setCausasFiltradas(causas)
    }
  }, [form.clienteId, causas])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'clienteId' ? { causaId: '' } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: form.esGratuita ? null : (form.valor ? Number(form.valor) : null),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { id } = await res.json()
      toast.success('Cita agendada')
      router.push(`/citas/${id}`)
    } catch {
      toast.error('Error al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  const necesitaLink = form.tipo === 'MEET' || form.tipo === 'ZOOM'

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href="/citas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a citas
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva cita</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Título */}
        <div>
          <label className="label">Título / Motivo de la cita *</label>
          <input name="titulo" value={form.titulo} onChange={handleChange} required className="input" placeholder="Ej: Consulta inicial caso laboral" />
        </div>

        {/* Tipo de cita */}
        <div>
          <label className="label">Modalidad *</label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo: t.value, linkReunion: '' }))}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  form.tipo === t.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enlace de reunión si Meet/Zoom */}
        {necesitaLink && (
          <div>
            <label className="label">
              Enlace de {form.tipo === 'MEET' ? 'Google Meet' : 'Zoom'} *
            </label>
            <div className="flex gap-2">
              <input
                name="linkReunion"
                value={form.linkReunion}
                onChange={handleChange}
                required={necesitaLink}
                className="input font-mono text-sm flex-1"
                placeholder={form.tipo === 'MEET' ? 'https://meet.google.com/...' : 'https://zoom.us/j/...'}
              />
              <a
                href={form.tipo === 'MEET' ? 'https://meet.google.com/new' : 'https://zoom.us/start/videomeeting'}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center px-3 py-2 rounded-lg border-2 border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all whitespace-nowrap"
              >
                Crear sala
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-1">Crea la reunión en {form.tipo === 'MEET' ? 'Google Meet' : 'Zoom'} con el botón y pega aquí el enlace generado</p>
          </div>
        )}

        {/* Fecha y hora */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required className="input" />
          </div>
          <div>
            <label className="label">Hora inicio *</label>
            <input name="horaInicio" type="time" value={form.horaInicio} onChange={handleChange} required className="input" />
          </div>
          <div>
            <label className="label">Hora fin</label>
            <input name="horaFin" type="time" value={form.horaFin} onChange={handleChange} className="input" />
          </div>
        </div>

        {/* Cliente y causa */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente</label>
            <select name="clienteId" value={form.clienteId} onChange={handleChange} className="input">
              <option value="">Sin cliente asignado</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Causa (ROL)</label>
            <select name="causaId" value={form.causaId} onChange={handleChange} className="input">
              <option value="">Sin causa asociada</option>
              {causasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>{c.rol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Valor / Gratuita */}
        <div className="card bg-gray-50 p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="esGratuita"
              checked={form.esGratuita}
              onChange={handleChange}
              className="h-4 w-4 rounded text-green-600"
            />
            <span className="text-sm font-medium text-gray-700">Consulta gratuita / sin cobro</span>
          </label>

          {!form.esGratuita && (
            <div>
              <label className="label">Valor de la consulta (CLP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  name="valor"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.valor}
                  onChange={handleChange}
                  className="input pl-7"
                  placeholder="50000"
                />
              </div>
            </div>
          )}
        </div>

        {/* Estado */}
        <div>
          <label className="label">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="input">
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="label">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="input resize-none" placeholder="Breve descripción del motivo o temas a tratar" />
        </div>

        {/* Notas */}
        <div>
          <label className="label">Notas internas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="input resize-none" placeholder="Recordatorios, preparativos, etc." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Creando...' : 'Crear cita'}
          </button>
          <Link href="/citas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
