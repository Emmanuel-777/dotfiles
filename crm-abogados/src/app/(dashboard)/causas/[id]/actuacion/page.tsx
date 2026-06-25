'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, ClipboardList } from 'lucide-react'

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

export default function NuevaActuacionPage() {
  const router = useRouter()
  const params = useParams()
  const causaId = params.id as string

  const [loading, setLoading] = useState(false)
  const [tieneCompromiso, setTieneCompromiso] = useState(false)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Presentación de escrito',
    descripcion: '',
    resultado: '',
    compromiso: '',
    fechaRecordatorio: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/actuaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          causaId,
          compromiso: tieneCompromiso ? form.compromiso : null,
          fechaRecordatorio: tieneCompromiso ? form.fechaRecordatorio : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push(`/causas/${causaId}`)
      router.refresh()
    } catch {
      alert('Error al registrar la gestión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/causas/${causaId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a la causa
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-xl p-2.5">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Registrar gestión</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
                <label className="label">Fecha del recordatorio</label>
                <input
                  name="fechaRecordatorio"
                  type="date"
                  value={form.fechaRecordatorio}
                  onChange={handleChange}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Aparecerá en el Dashboard cuando llegue esa fecha
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Registrando...' : 'Registrar gestión'}
          </button>
          <Link href={`/causas/${causaId}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
