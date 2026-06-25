'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS_TAREA } from '@/lib/utils'

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
    <select
      value={estado}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      onClick={(e) => e.stopPropagation()}
      className={`
        badge cursor-pointer border border-transparent rounded-full px-2 py-0.5 text-xs font-medium
        appearance-none outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
        ${info?.color ?? 'bg-gray-100 text-gray-700'}
        ${loading ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}
      `}
    >
      {OPCIONES.map((op) => (
        <option key={op.value} value={op.value}>{op.label}</option>
      ))}
    </select>
  )
}
