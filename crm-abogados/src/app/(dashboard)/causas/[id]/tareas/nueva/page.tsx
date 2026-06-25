'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, UserCheck } from 'lucide-react'

export default function NuevaTareaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const causaId = params.id

  const [loading, setLoading] = useState(false)
  const [esDerivada, setEsDerivada] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    fechaVencimiento: '',
    asignadoA: '',
    asignadoEmail: '',
    sistema: '',
    usuario: '',
    contrasena: '',
    notas: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const credencialesPortal =
        esDerivada && (form.sistema || form.usuario || form.contrasena)
          ? { sistema: form.sistema, usuario: form.usuario, contrasena: form.contrasena }
          : null

      const res = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion || null,
          prioridad: form.prioridad,
          estado: form.estado,
          fechaVencimiento: form.fechaVencimiento || null,
          asignadoA: esDerivada ? form.asignadoA || null : null,
          asignadoEmail: esDerivada ? form.asignadoEmail || null : null,
          esDerivada,
          credencialesPortal,
          notas: form.notas || null,
          causaId,
        }),
      })
      if (!res.ok) throw new Error('Error al crear tarea')
      router.push(`/causas/${causaId}`)
    } catch (err) {
      console.error(err)
      alert('Error al guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href={`/causas/${causaId}`}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la causa
      </Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nueva Tarea</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Título *</label>
          <input
            className="input"
            value={form.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            required
            placeholder="Ej: Presentar escrito de réplica"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prioridad</label>
            <select className="input" value={form.prioridad} onChange={(e) => set('prioridad', e.target.value)}>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Fecha de vencimiento</label>
          <input
            type="date"
            className="input"
            value={form.fechaVencimiento}
            onChange={(e) => set('fechaVencimiento', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={3}
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Detalle de la tarea..."
          />
        </div>

        {/* Derivar a tercero */}
        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 rounded"
              checked={esDerivada}
              onChange={(e) => setEsDerivada(e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-500" />
                Derivar a tercero
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Asignar esta tarea a un colaborador externo con credenciales de acceso
              </p>
            </div>
          </label>
        </div>

        {esDerivada && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
            <p className="text-sm font-semibold text-orange-800">Datos del tercero asignado</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  className="input"
                  value={form.asignadoA}
                  onChange={(e) => set('asignadoA', e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.asignadoEmail}
                  onChange={(e) => set('asignadoEmail', e.target.value)}
                  placeholder="correo@ejemplo.cl"
                />
              </div>
            </div>

            <div className="border-t border-orange-200 pt-3">
              <p className="text-xs font-semibold text-orange-700 mb-3">
                Credenciales de acceso al portal (opcional)
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">Sistema / Portal</label>
                  <input
                    className="input"
                    value={form.sistema}
                    onChange={(e) => set('sistema', e.target.value)}
                    placeholder="Ej: Poder Judicial, OIRS, SII, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Usuario</label>
                    <input
                      className="input"
                      value={form.usuario}
                      onChange={(e) => set('usuario', e.target.value)}
                      placeholder="Usuario o RUT"
                    />
                  </div>
                  <div>
                    <label className="label">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pr-10"
                        value={form.contrasena}
                        onChange={(e) => set('contrasena', e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="label">Notas</label>
          <textarea
            className="input"
            rows={2}
            value={form.notas}
            onChange={(e) => set('notas', e.target.value)}
            placeholder="Observaciones adicionales..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/causas/${causaId}`} className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Crear tarea'}
          </button>
        </div>
      </form>
    </div>
  )
}
