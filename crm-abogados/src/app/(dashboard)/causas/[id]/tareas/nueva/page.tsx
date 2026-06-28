'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevaTareaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [esDerivada, setEsDerivada] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    fechaVencimiento: '',
    notas: '',
    asignadoA: '',
    asignadoEmail: '',
    sistema: '',
    usuario: '',
    contrasena: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const credencialesPortal = esDerivada && form.sistema
        ? { sistema: form.sistema, usuario: form.usuario, contrasena: form.contrasena }
        : undefined

      const res = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion || undefined,
          prioridad: form.prioridad,
          estado: form.estado,
          fechaVencimiento: form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : undefined,
          notas: form.notas || undefined,
          asignadoA: esDerivada ? form.asignadoA : undefined,
          asignadoEmail: esDerivada ? form.asignadoEmail : undefined,
          esDerivada,
          credencialesPortal,
          causaId: params.id,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Tarea creada')
      router.push(`/causas/${params.id}`)
    } catch {
      toast.error('Error al guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href={`/causas/${params.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a la causa
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva tarea</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Título *</label>
            <input name="titulo" value={form.titulo} onChange={handleChange} required className="input" placeholder="Ej: Presentar recurso de apelación" />
          </div>

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
            <label className="label">Estado inicial</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En Progreso</option>
            </select>
          </div>

          <div>
            <label className="label">Fecha límite</label>
            <input name="fechaVencimiento" type="date" value={form.fechaVencimiento} onChange={handleChange} className="input" />
          </div>

          <div className="col-span-2">
            <label className="label">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="input resize-none" placeholder="Detalles de la tarea..." />
          </div>

          <div className="col-span-2">
            <label className="label">Notas internas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="input resize-none" />
          </div>
        </div>

        {/* Derivar a tercero */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={esDerivada}
              onChange={(e) => setEsDerivada(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="font-medium text-gray-700">Derivar a tercero</span>
          </label>

          {esDerivada && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nombre del tercero *</label>
                <input name="asignadoA" value={form.asignadoA} onChange={handleChange} required={esDerivada} className="input" placeholder="Nombre o empresa" />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input name="asignadoEmail" type="email" value={form.asignadoEmail} onChange={handleChange} className="input" placeholder="correo@ejemplo.com" />
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Credenciales de portal (opcional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Sistema / Portal</label>
                    <input name="sistema" value={form.sistema} onChange={handleChange} className="input" placeholder="Ej: Poder Judicial, SII..." />
                  </div>
                  <div>
                    <label className="label">Usuario</label>
                    <input name="usuario" value={form.usuario} onChange={handleChange} className="input" />
                  </div>
                  <div>
                    <label className="label">Contraseña</label>
                    <div className="relative">
                      <input
                        name="contrasena"
                        type={showPassword ? 'text' : 'password'}
                        value={form.contrasena}
                        onChange={handleChange}
                        className="input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar tarea'}
          </button>
          <Link href={`/causas/${params.id}`} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
