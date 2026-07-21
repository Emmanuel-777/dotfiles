'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, ClipboardList, Plus } from 'lucide-react'
import { toast } from 'sonner'
import AsesoriaArchivo from '@/components/AsesoriaArchivo'

const TIPOS = [
  'Presentación de escrito',
  'Audiencia',
  'Notificación enviada',
  'Notificación recibida',
  'Resolución recibida',
  'Llamada con cliente',
  'Llamada con contraparte',
  'Reunión',
  'Revisión de expediente',
  'Diligencia judicial',
  'Oficio enviado',
  'Oficio recibido',
  'Correo electrónico',
  'Otro',
]

export default function NuevaActuacionClientePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [loading, setLoading] = useState(false)
  const [causas, setCausas] = useState<{ id: string; rol: string; tribunal: string }[]>([])
  const [cargandoCausas, setCargandoCausas] = useState(true)
  const [archivo, setArchivo] = useState<{ url: string; nombre: string } | null>(null)
  const [tieneCompromiso, setTieneCompromiso] = useState(false)
  const [form, setForm] = useState({
    causaId: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Presentación de escrito',
    descripcion: '',
    resultado: '',
    compromiso: '',
    fechaRecordatorio: '',
  })

  useEffect(() => {
    fetch(`/api/causas?clienteId=${clienteId}`)
      .then((r) => r.json())
      .then((rows: { id: string; rol: string; tribunal: string }[]) => {
        setCausas(rows)
        setForm((p) => ({ ...p, causaId: rows[0]?.id ?? '' }))
      })
      .catch(() => {})
      .finally(() => setCargandoCausas(false))
  }, [clienteId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.causaId) {
      toast.error('Selecciona la causa a la que corresponde la actuación')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/actuaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          archivoUrl: archivo?.url,
          archivoNombre: archivo?.nombre,
          compromiso: tieneCompromiso ? form.compromiso : null,
          fechaRecordatorio: tieneCompromiso && form.fechaRecordatorio
            ? new Date(form.fechaRecordatorio).toISOString()
            : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Gestión registrada')
      router.push(`/clientes/${clienteId}`)
      router.refresh()
    } catch {
      toast.error('Error al registrar la gestión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-xl">
      <Link href={`/clientes/${clienteId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al cliente
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-xl p-2.5">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Registrar gestión</h1>
      </div>

      {!cargandoCausas && causas.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-600">
            Este cliente aún no tiene causas. Una actuación siempre pertenece a una causa.
          </p>
          <Link href={`/causas/nueva?clienteId=${clienteId}`} className="btn-primary mt-4 inline-flex">
            <Plus className="h-4 w-4" />
            Crear una causa primero
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Causa *</label>
            <select name="causaId" value={form.causaId} onChange={handleChange} required className="input">
              {cargandoCausas && <option value="">Cargando causas…</option>}
              {causas.map((c) => (
                <option key={c.id} value={c.id}>{c.rol} — {c.tribunal}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label">Tipo de gestión *</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
                {TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Descripción *</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={3}
              className="input resize-none"
              placeholder="Ej: Se presentó escrito de demanda ante el 1° Juzgado Civil de Santiago..."
            />
          </div>

          <div>
            <label className="label">Resultado / Observaciones</label>
            <textarea
              name="resultado"
              value={form.resultado}
              onChange={handleChange}
              rows={2}
              className="input resize-none"
              placeholder="Ej: Ingresado con número 45123, audiencia fijada para el 15 de julio..."
            />
          </div>

          <AsesoriaArchivo onChange={setArchivo} />

          {/* Compromiso del cliente */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tieneCompromiso}
                onChange={(e) => setTieneCompromiso(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                El cliente quedó con un compromiso — enviar recordatorio
              </span>
            </label>

            {tieneCompromiso && (
              <div className="mt-3 space-y-3 pl-7">
                <div>
                  <label className="label">¿Qué comprometió el cliente? *</label>
                  <textarea
                    name="compromiso"
                    value={form.compromiso}
                    onChange={handleChange}
                    required={tieneCompromiso}
                    rows={2}
                    className="input resize-none"
                    placeholder="Ej: Traer contrato de arrendamiento original y liquidaciones de sueldo"
                  />
                </div>
                <div>
                  <label className="label">Fecha y hora del recordatorio</label>
                  <input
                    name="fechaRecordatorio"
                    type="datetime-local"
                    value={form.fechaRecordatorio}
                    onChange={handleChange}
                    className="input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Aparecerá en el Dashboard cuando llegue esa fecha</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary">
              <Save className="h-4 w-4" />
              {loading ? 'Registrando...' : 'Registrar gestión'}
            </button>
            <Link href={`/clientes/${clienteId}`} className="btn-secondary">Cancelar</Link>
          </div>
        </form>
      )}
    </div>
  )
}
