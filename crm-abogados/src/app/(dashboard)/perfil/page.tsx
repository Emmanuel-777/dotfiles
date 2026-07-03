'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ShieldCheck, Save, Loader2, AlertTriangle, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { FormField, SelectField } from '@/components/FormField'

const BANCOS = [
  'Banco de Chile', 'Banco Estado', 'Banco Santander', 'Banco BCI',
  'Banco Itaú', 'Banco Scotiabank', 'Banco Security', 'Banco Falabella',
  'Banco Ripley', 'Banco Consorcio', 'Banco BICE', 'Coopeuch', 'Otro',
]

const TIPOS_CUENTA = ['Cuenta Corriente', 'Cuenta Vista', 'Cuenta de Ahorro', 'Cuenta RUT']

interface Perfil {
  email: string
  whatsapp: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  titularNombre: string
  titularRut: string
  perfilCompleto?: number
}

const VACIO: Perfil = {
  email: '', whatsapp: '', banco: '', tipoCuenta: '',
  numeroCuenta: '', titularNombre: '', titularRut: '',
}

export default function PerfilPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const obligatorio = searchParams.get('requerido') === '1'
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Perfil>(VACIO)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/perfil')
      .then((r) => r.json())
      .then((data: Perfil | null) => {
        if (data) {
          setForm({ ...VACIO, ...data })
        } else if (user?.emailAddresses[0]?.emailAddress) {
          setForm((f) => ({ ...f, email: user.emailAddresses[0].emailAddress }))
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  const set = (campo: keyof Perfil) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrors((er) => ({ ...er, [campo]: '' }))
  }

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}
    if (!form.email.trim()) nuevos.email = 'El correo es obligatorio'
    if (!form.whatsapp.trim()) nuevos.whatsapp = 'El WhatsApp es obligatorio'
    if (!form.banco.trim()) nuevos.banco = 'Selecciona un banco'
    if (!form.tipoCuenta.trim()) nuevos.tipoCuenta = 'Selecciona el tipo de cuenta'
    if (!form.numeroCuenta.trim()) nuevos.numeroCuenta = 'El número de cuenta es obligatorio'
    if (!form.titularNombre.trim()) nuevos.titularNombre = 'El nombre del titular es obligatorio'
    if (!form.titularRut.trim()) nuevos.titularRut = 'El RUT del titular es obligatorio'
    setErrors(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const guardar = async () => {
    if (!validar()) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Datos guardados correctamente')
      if (obligatorio) router.push('/dashboard')
      else router.refresh()
    } catch {
      toast.error('No se pudo guardar tu perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-500 text-sm mt-1">
          Confirma tus datos de contacto y cuenta bancaria.
        </p>
      </div>

      {obligatorio && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Debes completar tus datos para continuar</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Necesitamos tu correo, WhatsApp y cuenta bancaria para enviarte recordatorios y los pagos que te correspondan por citas u otros conceptos.
            </p>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">Contacto</h2>
        </div>

        <FormField
          label="Correo electrónico"
          type="email"
          required
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="tu@correo.cl"
        />
        <FormField
          label="WhatsApp"
          required
          value={form.whatsapp}
          onChange={set('whatsapp')}
          error={errors.whatsapp}
          hint="Aquí recibirás los recordatorios automáticos de tareas pendientes"
          placeholder="+56 9 1234 5678"
        />

        <div className="flex items-center gap-2 pt-3 pb-3 border-b border-t border-gray-100">
          <Landmark className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-900">Cuenta bancaria para pagos</h2>
        </div>

        <SelectField label="Banco" required value={form.banco} onChange={set('banco')} error={errors.banco}>
          <option value="">Selecciona un banco</option>
          {BANCOS.map((b) => <option key={b} value={b}>{b}</option>)}
        </SelectField>

        <SelectField label="Tipo de cuenta" required value={form.tipoCuenta} onChange={set('tipoCuenta')} error={errors.tipoCuenta}>
          <option value="">Selecciona el tipo</option>
          {TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>

        <FormField
          label="Número de cuenta"
          required
          value={form.numeroCuenta}
          onChange={set('numeroCuenta')}
          error={errors.numeroCuenta}
        />
        <FormField
          label="Nombre del titular"
          required
          value={form.titularNombre}
          onChange={set('titularNombre')}
          error={errors.titularNombre}
        />
        <FormField
          label="RUT del titular"
          required
          value={form.titularRut}
          onChange={set('titularRut')}
          error={errors.titularRut}
          placeholder="12.345.678-9"
        />

        <button
          onClick={guardar}
          disabled={saving}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando…' : 'Guardar datos'}
        </button>
      </div>
    </div>
  )
}
