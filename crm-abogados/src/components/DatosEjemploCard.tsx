'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'

// Tarjeta para cargar datos de ejemplo (solo se muestra a cuentas de prueba
// con el CRM vacío), para que puedan explorar sin partir de cero.
export default function DatosEjemploCard() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const res = await fetch('/api/trial/datos-ejemplo', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Datos de ejemplo cargados')
      router.refresh()
    } catch {
      toast.error('No se pudieron cargar los datos de ejemplo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> ¿Quieres explorar con datos de ejemplo?
          </p>
          <p className="text-xs text-violet-700 mt-0.5">
            Cargamos un par de clientes, causas, plazos y tareas de muestra para que pruebes todo.
            Puedes eliminarlos cuando quieras.
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Cargar ejemplos
        </button>
      </div>
    </div>
  )
}
