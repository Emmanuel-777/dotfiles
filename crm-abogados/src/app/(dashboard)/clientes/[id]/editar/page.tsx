'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

export default function EditarClientePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    tipo: 'PERSONA_NATURAL',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    ciudad: '',
    region: '',
    notas: '',
  })

  useEffect(() => {
    fetch(`/api/clientes/${params.id}`).then((r) => r.json()).then((data) => {
      setForm({
        nombre: data.nombre ?? '',
        rut: data.rut ?? '',
        tipo: data.tipo ?? 'PERSONA_NATURAL',
        email: data.email ?? '',
        telefono: data.telefono ?? '',
        celular: data.celular ?? '',
        direccion: data.direccion ?? '',
        ciudad: data.ciudad ?? '',
        region: data.region ?? '',
        notas: data.notas ?? '',
      })
    })
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push(`/clientes/${params.id}`)
    } catch {
      alert('Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este cliente? Se eliminarán todos sus registros asociados. Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      await fetch(`/api/clientes/${params.id}`, { method: 'DELETE' })
      router.push('/clientes')
    } catch {
      alert('Error al eliminar el cliente')
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/clientes/${params.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al cliente
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar cliente</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Eliminando...' : 'Eliminar cliente'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nombre completo / Razón social *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" />
          </div>

          <div>
            <label className="label">RUT *</label>
            <input name="rut" value={form.rut} onChange={handleChange} required className="input font-mono" placeholder="12.345.678-9" />
          </div>

          <div>
            <label className="label">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
              <option value="PERSONA_NATURAL">Persona Natural</option>
              <option value="PERSONA_JURIDICA">Persona Jurídica</option>
            </select>
          </div>

          <div>
            <label className="label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Celular</label>
            <input name="celular" value={form.celular} onChange={handleChange} className="input" placeholder="+56 9 1234 5678" />
          </div>

          <div>
            <label className="label">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} className="input" />
          </div>

          <div className="col-span-2">
            <label className="label">Región</label>
            <input name="region" value={form.region} onChange={handleChange} className="input" />
          </div>

          <div className="col-span-2">
            <label className="label">Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="input" />
          </div>

          <div className="col-span-2">
            <label className="label">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className="input resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/clientes/${params.id}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
