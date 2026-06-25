'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const ESTADOS = {
  PENDIENTE:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONFIRMADA: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETADA: { label: 'Completada', color: 'bg-green-100 text-green-800 border-green-200' },
  CANCELADA:  { label: 'Cancelada',  color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

export default function CitaEstadoSelect({ citaId, estadoActual }: { citaId: string; estadoActual: string }) {
  const router = useRouter()
  const [estado, setEstado] = useState(estadoActual)
  const [loading, setLoading] = useState(false)
  const info = ESTADOS[estado as keyof typeof ESTADOS]

  async function handleChange(nuevoEstado: string) {
    setLoading(true)
    setEstado(nuevoEstado)
    try {
      await fetch(`/api/citas/${citaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <select
        value={estado}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className={`
          appearance-none cursor-pointer pr-6 pl-2 py-1 rounded-full text-xs font-medium
          border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
          ${info?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}
          ${loading ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}
        `}
      >
        {Object.entries(ESTADOS).map(([value, s]) => (
          <option key={value} value={value}>{s.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 h-3 w-3 opacity-50" />
    </div>
  )
}
