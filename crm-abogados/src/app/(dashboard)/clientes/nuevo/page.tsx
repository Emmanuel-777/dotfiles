'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      router.push(`/clientes/${data.id}`)
    } catch (err) {
      alert('Error al guardar el cliente')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/clientes" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo cliente</h1>

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
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="input"
              placeholder={form.tipo === 'PERSONA_JURIDICA' ? 'Empresa S.A.' : 'Juan Pérez Muñoz'}
            />
          </div>

          <div>
            <label className="label">RUT *</label>
            <input
              name="rut"
              value={form.rut}
              onChange={handleChange}
              required
              className="input font-mono"
              placeholder="12.345.678-9"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              placeholder="correo@ejemplo.cl"
            />
          </div>

          <div>
            <label className="label">Teléfono fijo</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="input"
              placeholder="22 234 5678"
            />
          </div>

          <div>
            <label className="label">Celular</label>
            <input
              name="celular"
              value={form.celular}
              onChange={handleChange}
              className="input"
              placeholder="+56 9 8765 4321"
            />
          </div>

          <div className="col-span-2">
            <label className="label">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="input"
              placeholder="Av. Providencia 1234, Of. 502"
            />
          </div>

          <div>
            <label className="label">Ciudad</label>
            <input
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              className="input"
              placeholder="Santiago"
            />
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
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows={3}
              className="input resize-none"
              placeholder="Preferencias de contacto, observaciones, etc."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar cliente'}
          </button>
          <Link href="/clientes" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
