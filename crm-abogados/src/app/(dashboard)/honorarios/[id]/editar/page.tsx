'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

function EditarHonorarioForm() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [causas, setCausas] = useState<{ id: string; rol: string }[]>([])
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    tipo: 'HONORARIO',
    estado: 'PENDIENTE',
    fechaEmision: '',
    fechaVence: '',
    fechaPago: '',
    notas: '',
    causaId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/honorarios/${id}`).then((r) => r.json()),
      fetch('/api/causas').then((r) => r.json()),
    ]).then(([hon, cas]) => {
      setForm({
        descripcion: hon.descripcion ?? '',
        monto: String(hon.monto ?? ''),
        tipo: hon.tipo ?? 'HONORARIO',
        estado: hon.estado ?? 'PENDIENTE',
        fechaEmision: hon.fechaEmision ? hon.fechaEmision.split('T')[0] : '',
        fechaVence: hon.fechaVence ? hon.fechaVence.split('T')[0] : '',
        fechaPago: hon.fechaPago ? hon.fechaPago.split('T')[0] : '',
        notas: hon.notas ?? '',
        causaId: hon.causaId ?? '',
      })
      setCausas(cas)
      setFetching(false)
    })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/honorarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(form.monto),
          fechaEmision: form.fechaEmision ? new Date(form.fechaEmision).toISOString() : undefined,
          fechaVence: form.fechaVence ? new Date(form.fechaVence).toISOString() : '',
          fechaPago: form.fechaPago ? new Date(form.fechaPago).toISOString() : '',
          causaId: form.causaId || '',
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Honorario actualizado')
      router.push('/honorarios')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="p-4 lg:p-8 max-w-lg">
      <Link href="/honorarios" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar honorario</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Descripción *</label>
          <input name="descripcion" value={form.descripcion} onChange={handleChange} required className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Monto (CLP) *</label>
            <input name="monto" type="number" value={form.monto} onChange={handleChange} required className="input" min="0" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
              <option value="HONORARIO">Honorario</option>
              <option value="ANTICIPO">Anticipo</option>
              <option value="GASTO">Gasto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="input">
            <option value="PENDIENTE">Pendiente</option>
            <option value="PARCIAL">Parcial</option>
            <option value="PAGADO">Pagado</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>

        {(form.estado === 'PAGADO' || form.estado === 'PARCIAL') && (
          <div>
            <label className="label">Fecha de pago</label>
            <input name="fechaPago" type="date" value={form.fechaPago} onChange={handleChange} className="input" />
          </div>
        )}

        <div>
          <label className="label">Causa (opcional)</label>
          <select name="causaId" value={form.causaId} onChange={handleChange} className="input">
            <option value="">Sin causa asociada</option>
            {causas.map((c) => <option key={c.id} value={c.id}>{c.rol}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha emisión *</label>
            <input name="fechaEmision" type="date" value={form.fechaEmision} onChange={handleChange} required className="input" />
          </div>
          <div>
            <label className="label">Fecha vencimiento</label>
            <input name="fechaVence" type="date" value={form.fechaVence} onChange={handleChange} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="input resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/honorarios" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function EditarHonorarioPage() {
  return <Suspense><EditarHonorarioForm /></Suspense>
}
