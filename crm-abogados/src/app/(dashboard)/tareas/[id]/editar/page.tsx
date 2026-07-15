'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { toDatetimeLocalValue, formatFechaCorta } from '@/lib/utils'

type Gestion = { id: string; fecha: string; descripcion: string }

function EditarTareaForm() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    fechaVencimiento: '',
  })

  const [gestiones, setGestiones] = useState<Gestion[]>([])
  const [nuevaGestion, setNuevaGestion] = useState('')
  const [guardandoGestion, setGuardandoGestion] = useState(false)

  useEffect(() => {
    fetch(`/api/tareas/${id}`).then((r) => r.json()).then((t) => {
      setForm({
        titulo: t.titulo ?? '',
        descripcion: t.descripcion ?? '',
        prioridad: t.prioridad ?? 'MEDIA',
        estado: t.estado ?? 'PENDIENTE',
        fechaVencimiento: t.fechaVencimiento ? toDatetimeLocalValue(t.fechaVencimiento) : '',
      })
      setFetching(false)
    })
    cargarGestiones()
  }, [id])

  function cargarGestiones() {
    fetch(`/api/gestiones-tarea?tareaId=${id}`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setGestiones(data)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion || null,
          prioridad: form.prioridad,
          estado: form.estado,
          fechaVencimiento: form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Tarea actualizada')
      router.push('/tareas')
    } catch {
      toast.error('Error al guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  const agregarGestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaGestion.trim()) return
    setGuardandoGestion(true)
    try {
      const res = await fetch('/api/gestiones-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareaId: id, descripcion: nuevaGestion.trim() }),
      })
      if (!res.ok) throw new Error()
      setNuevaGestion('')
      cargarGestiones()
    } catch {
      toast.error('Error al agregar la gestión')
    } finally {
      setGuardandoGestion(false)
    }
  }

  const eliminarGestion = async (gestionId: string) => {
    setGestiones((prev) => prev.filter((g) => g.id !== gestionId))
    await fetch(`/api/gestiones-tarea/${gestionId}`, { method: 'DELETE' })
  }

  if (fetching) return <div className="p-8 text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href="/tareas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a tareas
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar tarea</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 mb-6">
        <div>
          <label className="label">Título *</label>
          <input name="titulo" value={form.titulo} onChange={handleChange} required className="input" />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="input resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prioridad</label>
            <select name="prioridad" value={form.prioridad} onChange={handleChange} className="input">
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Fecha y hora de vencimiento / compromiso</label>
          <input name="fechaVencimiento" type="datetime-local" value={form.fechaVencimiento} onChange={handleChange} className="input" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/tareas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>

      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-500" />
            Gestiones ({gestiones.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-50">
          {gestiones.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-gray-400">Sin gestiones registradas</p>
          ) : (
            gestiones.map((g) => (
              <div key={g.id} className="px-6 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-800">{g.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatFechaCorta(g.fecha)}</p>
                </div>
                <button
                  onClick={() => eliminarGestion(g.id)}
                  className="text-gray-300 hover:text-red-500 flex-shrink-0"
                  title="Eliminar gestión"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={agregarGestion} className="p-4 border-t border-gray-100 flex gap-2">
          <input
            value={nuevaGestion}
            onChange={(e) => setNuevaGestion(e.target.value)}
            placeholder="Ej: Llamé al cliente, quedó de enviar el documento el viernes..."
            className="input flex-1"
          />
          <button type="submit" disabled={guardandoGestion || !nuevaGestion.trim()} className="btn-secondary flex-shrink-0">
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </form>
      </div>
    </div>
  )
}

export default function EditarTareaPage() {
  return <Suspense><EditarTareaForm /></Suspense>
}
