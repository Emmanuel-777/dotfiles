'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

function NuevoDocumentoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [causas, setCausas] = useState<{ id: string; rol: string; cliente: { nombre: string } }[]>([])
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'ESCRITO',
    descripcion: '',
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
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      router.push('/documentos')
    } catch {
      alert('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <Link href="/documentos" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar documento</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Nombre del archivo *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="Demanda cobro de pesos.pdf" />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
            <option value="ESCRITO">Escrito</option>
            <option value="RESOLUCION">Resolución</option>
            <option value="CONTRATO">Contrato</option>
            <option value="PODER">Poder notarial</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div>
          <label className="label">Causa *</label>
          <select name="causaId" value={form.causaId} onChange={handleChange} required className="input">
            <option value="">Seleccionar causa...</option>
            {causas.map((c) => (
              <option key={c.id} value={c.id}>{c.rol} – {c.cliente?.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="input resize-none" placeholder="Breve descripción del documento..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Registrar'}
          </button>
          <Link href="/documentos" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevoDocumentoPage() {
  return <Suspense><NuevoDocumentoForm /></Suspense>
}
