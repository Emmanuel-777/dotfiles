'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

function NuevoPlazoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [causas, setCausas] = useState<{ id: string; rol: string; cliente: { nombre: string } }[]>([])
  const [form, setForm] = useState({
    titulo: '',
    fecha: '',
    tipo: 'AUDIENCIA',
    notas: '',
    causaId: searchParams.get('causaId') || '',
  })

  useEffect(() => {
    fetch('/api/causas').then((r) => r.json()).then(setCausas)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/plazos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fecha: new Date(form.fecha).toISOString() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Plazo agregado')
      router.push('/agenda')
    } catch {
      toast.error('Error al guardar el plazo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-lg">
      <Link href="/agenda" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a agenda
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo plazo / audiencia</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Título *</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
            className="input"
            placeholder="Ej: Audiencia de conciliación"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha *</label>
            <input
              name="fecha"
              type="datetime-local"
              value={form.fecha}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
              <option value="AUDIENCIA">Audiencia</option>
              <option value="VENCIMIENTO">Vencimiento</option>
              <option value="NOTIFICACION">Notificación</option>
              <option value="PRESENTACION">Presentación escrito</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Causa *</label>
          <select name="causaId" value={form.causaId} onChange={handleChange} required className="input">
            <option value="">Seleccionar causa...</option>
            {causas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.rol} – {c.cliente?.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            rows={2}
            className="input resize-none"
            placeholder="Sala, hora, preparación necesaria..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar plazo'}
          </button>
          <Link href="/agenda" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevoPlazoPage() {
  return (
    <Suspense>
      <NuevoPlazoForm />
    </Suspense>
  )
}
