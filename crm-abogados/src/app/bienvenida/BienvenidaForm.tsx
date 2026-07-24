'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'

export default function BienvenidaForm() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [nombre, setNombre] = useState('')
  const [rut, setRut] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) {
      toast.error('Debes aceptar el tratamiento de datos para continuar')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/trial/activar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rut, consentimiento: consent }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'No se pudo activar la prueba')
        return
      }
      // Forzar un token nuevo para que el estado de prueba viaje en la sesión.
      try { await getToken({ skipCache: true }) } catch {}
      toast.success('¡Tu prueba de 7 días está activa!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Ocurrió un error. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Ej: Karen Garrido"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
        <input
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          required
          placeholder="12.345.678-9"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Autorizo el tratamiento de mis datos personales (incluido mi RUT) para crear y
          administrar mi cuenta, conforme a la{' '}
          <a href="https://lexcrm.site/politica-de-privacidad.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Política de Privacidad
          </a>{' '}
          y la Ley 21.719.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#14254c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3060] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Comenzar mi prueba de 7 días
      </button>
    </form>
  )
}
