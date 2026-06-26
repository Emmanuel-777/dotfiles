'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function ConvertirProspectoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [prospectoNombre, setProspectoNombre] = useState('')
  const [form, setForm] = useState({
    rut: '',
    nombre: '',
    tipo: 'PERSONA_NATURAL',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    ciudad: 'Santiago',
    region: 'Región Metropolitana',
    notas: '',
  })

  useEffect(() => {
    fetch(`/api/prospectos/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { toast.error('Prospecto no encontrado'); router.push('/embudo'); return }
        if (data.clienteId) {
          toast.info('Este prospecto ya fue convertido en cliente')
          router.push(`/clientes/${data.clienteId}`)
          return
        }
        setProspectoNombre(data.nombre ?? '')
        const esEmpresa = !!data.empresa
        setForm(prev => ({
          ...prev,
          // Si tiene empresa, se asume persona jurídica con esa razón social
          tipo: esEmpresa ? 'PERSONA_JURIDICA' : 'PERSONA_NATURAL',
          nombre: esEmpresa ? data.empresa : (data.nombre ?? ''),
          email: data.email ?? '',
          telefono: data.telefono ?? '',
          notas: [data.notas, data.empresa ? `Contacto: ${data.nombre}` : null]
            .filter(Boolean)
            .join('\n') || '',
        }))
        setCargando(false)
      })
      .catch(() => { toast.error('Error al cargar el prospecto'); router.push('/embudo') })
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/prospectos/${id}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al convertir')
      toast.success('Prospecto convertido en cliente')
      router.push(`/clientes/${data.clienteId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al convertir el prospecto')
    } finally {
      setLoading(false)
    }
  }

  if (cargando) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/embudo" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver al embudo
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-2">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Convertir en cliente</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Crea un cliente a partir del prospecto <span className="font-medium text-gray-700">{prospectoNombre}</span>.
        Completa el RUT para finalizar.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Tipo de cliente</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
              <option value="PERSONA_NATURAL">Persona Natural</option>
              <option value="PERSONA_JURIDICA">Persona Jurídica</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">
              {form.tipo === 'PERSONA_JURIDICA' ? 'Razón social' : 'Nombre completo'} *
            </label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" />
          </div>

          <div>
            <label className="label">RUT *</label>
            <input
              name="rut"
              value={form.rut}
              onChange={handleChange}
              required
              autoFocus
              className="input font-mono"
              placeholder="12.345.678-9"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Teléfono fijo</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Celular</label>
            <input name="celular" value={form.celular} onChange={handleChange} className="input" />
          </div>

          <div className="col-span-2">
            <label className="label">Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="label">Región</label>
            <select name="region" value={form.region} onChange={handleChange} className="input">
              <option>Región Metropolitana</option>
              <option>Región de Valparaíso</option>
              <option>Región del Biobío</option>
              <option>Región de La Araucanía</option>
              <option>Región de Los Lagos</option>
              <option>Región de Antofagasta</option>
              <option>Región de Atacama</option>
              <option>Región de Coquimbo</option>
              <option>Región del Maule</option>
              <option>Región de Ñuble</option>
              <option>Región de Los Ríos</option>
              <option>Región de Aysén</option>
              <option>Región de Magallanes</option>
              <option>Región de Tarapacá</option>
              <option>Región de Arica y Parinacota</option>
              <option>Región de O'Higgins</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Notas internas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className="input resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            {loading ? 'Convirtiendo...' : 'Crear cliente'}
          </button>
          <Link href="/embudo" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
