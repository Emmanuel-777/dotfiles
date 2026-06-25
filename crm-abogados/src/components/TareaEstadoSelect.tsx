'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS_TAREA } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const OPCIONES = Object.entries(ESTADOS_TAREA).map(([value, info]) => ({ value, label: info.label, color: info.color }))

export default function TareaEstadoSelect({ tareaId, estadoActual }: { tareaId: string; estadoActual: string }) {
  const router = useRouter()
  const [estado, setEstado] = useState(estadoActual)
  const [loading, setLoading] = useState(false)

  const info = ESTADOS_TAREA[estado as keyof typeof ESTADOS_TAREA]

  async function handleChange(nuevoEstado: string) {
    setLoading(true)
    setEstado(nuevoEstado)
    try {
      await fetch(`/api/tareas/${tareaId}`, {
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
          appearance-none cursor-pointer pr-6 pl-2 py-0.5 rounded-full text-xs font-medium
          border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
          ${info?.color ?? 'bg-gray-100 text-gray-700 border-gray-200'}
          ${loading ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}
        `}
      >
        {OPCIONES.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 h-3 w-3 opacity-50" />
    </div>
  )
}
