'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevaTareaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [esDerivada, setEsDerivada] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string; rut: string }[]>([])
  const [causas, setCausas] = useState<{ id: string; rol: string; tipoCausa: string }[]>([])
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    fechaVencimiento: '',
    clienteId: '',
    causaId: '',
    notas: '',
    asignadoA: '',
    asignadoEmail: '',
    sistema: '',
    usuario: '',
    contrasena: '',
  })

  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [guardandoCliente, setGuardandoCliente] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ tipo: 'PERSONA_NATURAL', nombre: '', rut: '', email: '', celular: '' })

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setClientes(data)
    })
  }, [])

  useEffect(() => {
    if (!form.clienteId) { setCausas([]); return }
    fetch(`/api/causas?clienteId=${form.clienteId}`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setCausas(data)
    })
  }, [form.clienteId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'clienteId' ? { causaId: '' } : {}),
    }))
  }

  const crearClienteRapido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoCliente.rut.trim() || !nuevoCliente.nombre.trim()) return
    setGuardandoCliente(true)
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCliente),
      })
      if (!res.ok) throw new Error(await res.text())
      const creado = await res.json()
      setClientes((prev) => [...prev, { id: creado.id, nombre: nuevoCliente.nombre, rut: nuevoCliente.rut }])
      setForm((prev) => ({ ...prev, clienteId: creado.id }))
      setMostrarModalCliente(false)
      setNuevoCliente({ tipo: 'PERSONA_NATURAL', nombre: '', rut: '', email: '', celular: '' })
      toast.success('Cliente creado y seleccionado')
    } catch {
      toast.error('Error al crear el cliente — revisa que el RUT no esté repetido')
    } finally {
      setGuardandoCliente(false)
    }
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
          clienteId: form.clienteId,
          causaId: form.causaId || undefined,
          notas: form.notas || undefined,
          asignadoA: esDerivada ? form.asignadoA : undefined,
          asignadoEmail: esDerivada ? form.asignadoEmail : undefined,
          esDerivada,
          credencialesPortal,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Tarea creada')
      router.push('/tareas')
    } catch {
      toast.error('Error al guardar la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href="/tareas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a tareas
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva tarea</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Título *</label>
            <input name="titulo" value={form.titulo} onChange={handleChange} required className="input" placeholder="Ej: Revisar contrato, llamar al cliente..." />
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
            <label className="label">Fecha y hora límite</label>
            <input name="fechaVencimiento" type="datetime-local" value={form.fechaVencimiento} onChange={handleChange} className="input" />
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between">
              <label className="label">Cliente *</label>
              <button
                type="button"
                onClick={() => setMostrarModalCliente(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-1.5"
              >
                <Plus className="h-3 w-3" /> Agregar cliente
              </button>
            </div>
            <select name="clienteId" value={form.clienteId} onChange={handleChange} required className="input">
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.rut})</option>
              ))}
            </select>
          </div>

          {causas.length > 0 && (
            <div className="col-span-2">
              <label className="label">Causa asociada (opcional)</label>
              <select name="causaId" value={form.causaId} onChange={handleChange} className="input">
                <option value="">Sin causa específica</option>
                {causas.map((c) => (
                  <option key={c.id} value={c.id}>{c.rol} — {c.tipoCausa}</option>
                ))}
              </select>
            </div>
          )}

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
          <Link href="/tareas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>

      {mostrarModalCliente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setMostrarModalCliente(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Agregar cliente</h2>
              <button type="button" onClick={() => setMostrarModalCliente(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={crearClienteRapido} className="space-y-4">
              <div>
                <label className="label">Tipo de cliente</label>
                <select
                  value={nuevoCliente.tipo}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, tipo: e.target.value }))}
                  className="input"
                >
                  <option value="PERSONA_NATURAL">Persona Natural</option>
                  <option value="PERSONA_JURIDICA">Persona Jurídica</option>
                </select>
              </div>
              <div>
                <label className="label">{nuevoCliente.tipo === 'PERSONA_JURIDICA' ? 'Razón social' : 'Nombre completo'} *</label>
                <input
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, nombre: e.target.value }))}
                  required
                  className="input"
                  placeholder={nuevoCliente.tipo === 'PERSONA_JURIDICA' ? 'Empresa S.A.' : 'Juan Pérez Muñoz'}
                />
              </div>
              <div>
                <label className="label">RUT *</label>
                <input
                  value={nuevoCliente.rut}
                  onChange={(e) => setNuevoCliente((p) => ({ ...p, rut: e.target.value }))}
                  required
                  className="input"
                  placeholder="12345678-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente((p) => ({ ...p, email: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Celular</label>
                  <input
                    value={nuevoCliente.celular}
                    onChange={(e) => setNuevoCliente((p) => ({ ...p, celular: e.target.value }))}
                    className="input"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={guardandoCliente} className="btn-primary flex-1 justify-center">
                  {guardandoCliente ? 'Guardando...' : 'Crear y seleccionar'}
                </button>
                <button type="button" onClick={() => setMostrarModalCliente(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
