'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, NotebookPen } from 'lucide-react'
import { toast } from 'sonner'
import AsesoriaArchivo from '@/components/AsesoriaArchivo'

const TIPOS = [
  'Consulta general',
  'Llamada telefónica',
  'Reunión presencial',
  'Videollamada',
  'Correo electrónico',
  'Otro',
]

export default function NuevaAsesoriaPage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: TIPOS[0],
    descripcion: '',
  })
  const [archivo, setArchivo] = useState<{ url: string; nombre: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/asesorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clienteId, archivoUrl: archivo?.url, archivoNombre: archivo?.nombre }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Asesoría registrada')
      router.push(`/clientes/${clienteId}`)
      router.refresh()
    } catch {
      toast.error('Error al registrar la asesoría')
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
          <NotebookPen className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Registrar asesoría</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha *</label>
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required className="input" />
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notas *</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            required
            rows={4}
            className="input resize-none"
            placeholder="Ej: Consulta sobre plazo para responder demanda, se orientó al cliente sobre próximos pasos..."
          />
        </div>

        <AsesoriaArchivo onChange={setArchivo} />

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Registrando...' : 'Registrar asesoría'}
          </button>
          <Link href={`/clientes/${clienteId}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
