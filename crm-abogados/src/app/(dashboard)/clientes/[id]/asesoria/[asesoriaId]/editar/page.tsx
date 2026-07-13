'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, NotebookPen, Trash2 } from 'lucide-react'
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

export default function EditarAsesoriaPage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string
  const asesoriaId = params.asesoriaId as string

  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    fecha: '',
    tipo: TIPOS[0],
    descripcion: '',
  })
  const [existente, setExistente] = useState<{ url: string; nombre: string } | null>(null)
  const [archivo, setArchivo] = useState<{ url: string; nombre: string } | null | undefined>(undefined)

  useEffect(() => {
    fetch(`/api/asesorias/${asesoriaId}`).then((r) => r.json()).then((data) => {
      setForm({
        fecha: data.fecha ? data.fecha.split('T')[0] : '',
        tipo: data.tipo ?? TIPOS[0],
        descripcion: data.descripcion ?? '',
      })
      if (data.archivoUrl) setExistente({ url: data.archivoUrl, nombre: data.archivoNombre ?? 'documento' })
    })
  }, [asesoriaId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body: Record<string, unknown> = { ...form }
      // archivo === undefined -> el usuario no tocó el adjunto, no enviar cambios de archivo
      if (archivo !== undefined) {
        body.archivoUrl = archivo?.url ?? null
        body.archivoNombre = archivo?.nombre ?? null
      }
      const res = await fetch(`/api/asesorias/${asesoriaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Asesoría actualizada')
      router.push(`/clientes/${clienteId}`)
      router.refresh()
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este registro de asesoría? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      await fetch(`/api/asesorias/${asesoriaId}`, { method: 'DELETE' })
      toast.success('Registro eliminado')
      router.push(`/clientes/${clienteId}`)
      router.refresh()
    } catch {
      toast.error('Error al eliminar')
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-xl">
      <Link href={`/clientes/${clienteId}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al cliente
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-xl p-2.5">
            <NotebookPen className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Editar asesoría</h1>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
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
          />
        </div>

        <AsesoriaArchivo existente={existente} onChange={setArchivo} />

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/clientes/${clienteId}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
