'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

function NuevoHonorarioForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [causas, setCausas] = useState<{ id: string; rol: string }[]>([])
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    tipo: 'HONORARIO',
    estado: 'PENDIENTE',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVence: '',
    notas: '',
    clienteId: searchParams.get('clienteId') || '',
    causaId: searchParams.get('causaId') || '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/clientes').then((r) => r.json()),
      fetch('/api/causas').then((r) => r.json()),
    ]).then(([c, ca]) => { setClientes(c); setCausas(ca) })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/honorarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(form.monto),
          fechaEmision: new Date(form.fechaEmision).toISOString(),
          fechaVence: form.fechaVence ? new Date(form.fechaVence).toISOString() : null,
          causaId: form.causaId || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Honorario registrado')
      router.push('/honorarios')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-lg">
      <Link href="/honorarios" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo honorario</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Descripción *</label>
          <input name="descripcion" value={form.descripcion} onChange={handleChange} required className="input" placeholder="Ej: Honorarios causa C-1234-2024" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Monto (CLP) *</label>
            <input name="monto" type="number" value={form.monto} onChange={handleChange} required className="input" placeholder="850000" min="0" />
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
          <label className="label">Cliente *</label>
          <select name="clienteId" value={form.clienteId} onChange={handleChange} required className="input">
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

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
          <label className="label">Estado inicial</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="input">
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADO">Pagado</option>
            <option value="PARCIAL">Parcial</option>
          </select>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="input resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <Link href="/honorarios" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevoHonorarioPage() {
  return <Suspense><NuevoHonorarioForm /></Suspense>
}
