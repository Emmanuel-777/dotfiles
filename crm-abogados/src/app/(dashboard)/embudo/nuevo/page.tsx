'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

const ORIGENES = [
  { value: 'REFERIDO',         label: 'Referido / Recomendación' },
  { value: 'REDES_SOCIALES',   label: 'Redes Sociales' },
  { value: 'SITIO_WEB',        label: 'Sitio Web' },
  { value: 'CONTACTO_DIRECTO', label: 'Contacto Directo' },
  { value: 'OTRO',             label: 'Otro' },
]

const ETAPAS = [
  { value: 'CONTACTO',  label: 'Contacto inicial' },
  { value: 'REUNION',   label: 'Reunión agendada' },
  { value: 'PROPUESTA', label: 'Propuesta enviada' },
  { value: 'GANADO',    label: 'Ganado' },
  { value: 'PERDIDO',   label: 'Perdido' },
]

export default function NuevoProspectoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    origen: 'REFERIDO',
    etapa: 'CONTACTO',
    valorEstimado: '',
    notas: '',
    fechaContacto: new Date().toISOString().split('T')[0],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/prospectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Prospecto agregado al embudo')
      router.push('/embudo')
    } catch {
      toast.error('Error al guardar el prospecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/embudo" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al embudo
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo prospecto</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nombre completo *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="input"
              placeholder="Juan Pérez Muñoz"
            />
          </div>

          <div className="col-span-2">
            <label className="label">Empresa / Organización</label>
            <input
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              className="input"
              placeholder="Empresa S.A. (opcional)"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              placeholder="correo@ejemplo.cl"
            />
          </div>

          <div>
            <label className="label">Teléfono / Celular</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="input"
              placeholder="+56 9 8765 4321"
            />
          </div>

          <div>
            <label className="label">Origen del contacto</label>
            <select name="origen" value={form.origen} onChange={handleChange} className="input">
              {ORIGENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Etapa inicial</label>
            <select name="etapa" value={form.etapa} onChange={handleChange} className="input">
              {ETAPAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Valor estimado (CLP)</label>
            <input
              name="valorEstimado"
              type="number"
              min="0"
              step="1000"
              value={form.valorEstimado}
              onChange={handleChange}
              className="input"
              placeholder="500000"
            />
          </div>

          <div>
            <label className="label">Fecha de primer contacto *</label>
            <input
              name="fechaContacto"
              type="date"
              value={form.fechaContacto}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="col-span-2">
            <label className="label">Notas internas</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows={3}
              className="input resize-none"
              placeholder="Necesidades del prospecto, contexto de la consulta, próximos pasos…"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Agregar al embudo'}
          </button>
          <Link href="/embudo" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
