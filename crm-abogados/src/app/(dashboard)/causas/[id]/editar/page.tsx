'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { TIPOS_CAUSA } from '@/lib/utils'
import TribunalSelect from '@/components/TribunalSelect'
import { toast } from 'sonner'

export default function EditarCausaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string; rut: string }[]>([])
  const [form, setForm] = useState({
    rol: '',
    tribunal: '',
    tipoCausa: 'Civil',
    materia: '',
    estado: 'EN_TRAMITE',
    fechaIngreso: '',
    contraparte: '',
    abogadoResponsable: '',
    descripcion: '',
    clienteId: '',
    fechaPrescripcion: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/causas/${params.id}`).then((r) => r.json()),
      fetch('/api/clientes').then((r) => r.json()),
    ]).then(([causa, clientesList]) => {
      setClientes(clientesList)
      setForm({
        rol: causa.rol ?? '',
        tribunal: causa.tribunal ?? '',
        tipoCausa: causa.tipoCausa ?? 'Civil',
        materia: causa.materia ?? '',
        estado: causa.estado ?? 'EN_TRAMITE',
        fechaIngreso: causa.fechaIngreso ? causa.fechaIngreso.split('T')[0] : '',
        contraparte: causa.contraparte ?? '',
        abogadoResponsable: causa.abogadoResponsable ?? '',
        descripcion: causa.descripcion ?? '',
        clienteId: causa.clienteId ?? '',
        fechaPrescripcion: causa.fechaPrescripcion ? causa.fechaPrescripcion.split('T')[0] : '',
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
      const res = await fetch(`/api/causas/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fechaIngreso: new Date(form.fechaIngreso).toISOString(),
          fechaPrescripcion: form.fechaPrescripcion || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Cambios guardados')
      router.push(`/causas/${params.id}`)
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta causa y todos sus registros asociados? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      await fetch(`/api/causas/${params.id}`, { method: 'DELETE' })
      toast.success('Causa eliminada')
      router.push('/causas')
    } catch {
      toast.error('Error al eliminar la causa')
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href={`/causas/${params.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a la causa
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar causa</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Eliminando...' : 'Eliminar causa'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ROL / RIT *</label>
            <input name="rol" value={form.rol} onChange={handleChange} required className="input font-mono" placeholder="C-1234-2024" />
          </div>

          <div>
            <label className="label">Tipo de causa *</label>
            <select name="tipoCausa" value={form.tipoCausa} onChange={handleChange} className="input">
              {TIPOS_CAUSA.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Tribunal *</label>
            <TribunalSelect
              value={form.tribunal}
              onChange={(v) => setForm((prev) => ({ ...prev, tribunal: v }))}
              tipoCausa={form.tipoCausa}
            />
          </div>

          <div className="col-span-2">
            <label className="label">Cliente *</label>
            <select name="clienteId" value={form.clienteId} onChange={handleChange} required className="input">
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.rut})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Materia</label>
            <input name="materia" value={form.materia} onChange={handleChange} className="input" placeholder="Ej: Cobro de pesos" />
          </div>

          <div>
            <label className="label">Fecha de ingreso *</label>
            <input name="fechaIngreso" type="date" value={form.fechaIngreso} onChange={handleChange} required className="input" />
          </div>

          {form.tipoCausa === 'Penal' && (
            <div>
              <label className="label">Fecha de prescripción de la acción penal</label>
              <input name="fechaPrescripcion" type="date" value={form.fechaPrescripcion} onChange={handleChange} className="input" />
              <p className="text-xs text-gray-400 mt-1">Se usa para alertarte cuando se acerque, conforme a la Ley 21.719 (Arts. 24-25).</p>
            </div>
          )}

          <div>
            <label className="label">Carátula</label>
            <input name="contraparte" value={form.contraparte} onChange={handleChange} className="input" placeholder="Ej: Pérez con García" />
          </div>

          <div>
            <label className="label">Abogado responsable</label>
            <input name="abogadoResponsable" value={form.abogadoResponsable} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="EN_TRAMITE">En Trámite</option>
              <option value="SUSPENDIDA">Suspendida</option>
              <option value="TERMINADA">Terminada</option>
              <option value="ARCHIVADA">Archivada</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Descripción / Notas</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="input resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/causas/${params.id}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
