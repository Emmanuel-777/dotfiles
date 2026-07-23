'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Botón para marcar un plazo como cumplido (o reabrirlo). Usa el endpoint
// existente PUT /api/plazos, que recibe { id, ...cambios }.
export default function PlazoCheck({ plazoId, estado }: { plazoId: string; estado: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cambiar(nuevoEstado: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/plazos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plazoId, estado: nuevoEstado }),
      })
      if (!res.ok) throw new Error()
      toast.success(nuevoEstado === 'COMPLETADO' ? 'Plazo marcado como cumplido' : 'Plazo reabierto')
      router.refresh()
    } catch {
      toast.error('No se pudo actualizar el plazo')
    } finally {
      setLoading(false)
    }
  }

  if (estado === 'COMPLETADO') {
    return (
      <button
        type="button"
        onClick={() => cambiar('PENDIENTE')}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        Reabrir
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => cambiar('COMPLETADO')}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
      Marcar cumplido
    </button>
  )
}
