'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { formatMonto, formatFechaCorta } from '@/lib/utils'

type Cuota = { id: string; monto: number; fechaPago: string; pagada: number }

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

  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [nuevaCuota, setNuevaCuota] = useState({ monto: '', fechaPago: '' })
  const [guardandoCuota, setGuardandoCuota] = useState(false)

  const cargarCuotas = () => {
    fetch(`/api/cuotas-honorario?honorarioId=${id}`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setCuotas(data)
    })
  }

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
    cargarCuotas()
  }, [id])

  const agregarCuota = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaCuota.monto || !nuevaCuota.fechaPago) return
    setGuardandoCuota(true)
    try {
      const res = await fetch('/api/cuotas-honorario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ honorarioId: id, monto: parseFloat(nuevaCuota.monto), fechaPago: nuevaCuota.fechaPago }),
      })
      if (!res.ok) throw new Error()
      setNuevaCuota({ monto: '', fechaPago: '' })
      cargarCuotas()
      toast.success('Cuota agregada — se creó una tarea de recordatorio')
    } catch {
      toast.error('Error al agregar la cuota')
    } finally {
      setGuardandoCuota(false)
    }
  }

  const togglePagada = async (cuota: Cuota) => {
    setCuotas((prev) => prev.map((c) => c.id === cuota.id ? { ...c, pagada: cuota.pagada ? 0 : 1 } : c))
    await fetch(`/api/cuotas-honorario/${cuota.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagada: cuota.pagada ? 0 : 1 }),
    })
  }

  const eliminarCuota = async (cuotaId: string) => {
    setCuotas((prev) => prev.filter((c) => c.id !== cuotaId))
    await fetch(`/api/cuotas-honorario/${cuotaId}`, { method: 'DELETE' })
  }

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

        {form.estado === 'PARCIAL' && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Cuotas y fechas de pago</p>
            <p className="text-xs text-gray-400 -mt-2">Cada cuota crea automáticamente una tarea de recordatorio con esa fecha.</p>

            {cuotas.length > 0 && (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {cuotas.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <button type="button" onClick={() => togglePagada(c)} className="flex items-center gap-2 text-left">
                      {c.pagada ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
                      <span className={c.pagada ? 'line-through text-gray-400' : 'text-gray-800'}>
                        {formatMonto(c.monto)} — {formatFechaCorta(c.fechaPago)}
                      </span>
                    </button>
                    <button type="button" onClick={() => eliminarCuota(c.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={nuevaCuota.monto}
                onChange={(e) => setNuevaCuota((p) => ({ ...p, monto: e.target.value }))}
                className="input"
                placeholder="Monto"
              />
              <input
                type="date"
                value={nuevaCuota.fechaPago}
                onChange={(e) => setNuevaCuota((p) => ({ ...p, fechaPago: e.target.value }))}
                className="input"
              />
              <button
                type="button"
                onClick={agregarCuota}
                disabled={guardandoCuota || !nuevaCuota.monto || !nuevaCuota.fechaPago}
                className="btn-secondary flex-shrink-0 px-3"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
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
