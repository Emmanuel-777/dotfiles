'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { TIPOS_CAUSA, TRIBUNALES_CHILE } from '@/lib/utils'
import { toast } from 'sonner'

function NuevaCausaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string; rut: string }[]>([])
  const [form, setForm] = useState({
    rol: '',
    tribunal: '',
    tipoCausa: 'Civil',
    materia: '',
    estado: 'EN_TRAMITE',
    fechaIngreso: new Date().toISOString().split('T')[0],
    contraparte: '',
    abogadoResponsable: '',
    descripcion: '',
    clienteId: searchParams.get('clienteId') || '',
  })

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then(setClientes)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/causas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fechaIngreso: new Date(form.fechaIngreso).toISOString() }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Causa creada correctamente')
      const data = await res.json()
      router.push(`/causas/${data.id}`)
    } catch {
      toast.error('Error al guardar la causa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/causas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a causas
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva causa</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ROL / RIT *</label>
            <input
              name="rol"
              value={form.rol}
              onChange={handleChange}
              required
              className="input font-mono"
              placeholder="C-1234-2024"
            />
          </div>

          <div>
            <label className="label">Tipo de causa *</label>
            <select name="tipoCausa" value={form.tipoCausa} onChange={handleChange} className="input">
              {TIPOS_CAUSA.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Tribunal *</label>
            <input
              name="tribunal"
              value={form.tribunal}
              onChange={handleChange}
              required
              list="tribunales-list"
              className="input"
              placeholder="Buscar tribunal..."
            />
            <datalist id="tribunales-list">
              {TRIBUNALES_CHILE.map((t) => <option key={t} value={t} />)}
            </datalist>
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
            <input
              name="materia"
              value={form.materia}
              onChange={handleChange}
              className="input"
              placeholder="Ej: Cobro de pesos"
            />
          </div>

          <div>
            <label className="label">Fecha de ingreso *</label>
            <input
              name="fechaIngreso"
              type="date"
              value={form.fechaIngreso}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Contraparte</label>
            <input
              name="contraparte"
              value={form.contraparte}
              onChange={handleChange}
              className="input"
              placeholder="Nombre o razón social"
            />
          </div>

          <div>
            <label className="label">Abogado responsable</label>
            <input
              name="abogadoResponsable"
              value={form.abogadoResponsable}
              onChange={handleChange}
              className="input"
              placeholder="Abg. Juan Pérez"
            />
          </div>

          <div>
            <label className="label">Estado inicial</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="EN_TRAMITE">En Trámite</option>
              <option value="SUSPENDIDA">Suspendida</option>
              <option value="TERMINADA">Terminada</option>
              <option value="ARCHIVADA">Archivada</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Descripción / Notas</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              className="input resize-none"
              placeholder="Resumen del caso, antecedentes relevantes..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar causa'}
          </button>
          <Link href="/causas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevaCausaPage() {
  return (
    <Suspense>
      <NuevaCausaForm />
    </Suspense>
  )
}
