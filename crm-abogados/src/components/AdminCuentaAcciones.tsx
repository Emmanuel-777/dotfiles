'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Ban, RotateCcw, XCircle, Trash2 } from 'lucide-react'

type Accion = 'activar' | 'suspender' | 'reactivar' | 'eliminar' | 'purgar'

export default function AdminCuentaAcciones({
  userId,
  estado,
  gestionable = false,
  puedeEliminar = false,
  etiqueta = '',
}: {
  userId: string
  estado: string
  gestionable?: boolean
  puedeEliminar?: boolean
  etiqueta?: string
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState<Accion | null>(null)

  async function ejecutar(accion: Accion, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return
    setCargando(accion)
    try {
      const res = await fetch('/api/admin/cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accion }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '')
      toast.success(accion === 'purgar' ? 'Usuario eliminado' : 'Cuenta actualizada')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'No se pudo completar la acción')
    } finally {
      setCargando(null)
    }
  }

  const btn = 'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50'

  return (
    <div className="flex flex-wrap gap-1.5">
      {gestionable && (
        <>
          {estado !== 'activo' && (
            <button onClick={() => ejecutar('activar')} disabled={cargando !== null}
              className={`${btn} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}>
              {cargando === 'activar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Activar pagado
            </button>
          )}
          {estado !== 'suspendido' && (
            <button onClick={() => ejecutar('suspender', '¿Suspender esta cuenta? Perderá el acceso al CRM.')} disabled={cargando !== null}
              className={`${btn} border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}>
              {cargando === 'suspender' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
              Suspender
            </button>
          )}
          <button onClick={() => ejecutar('reactivar')} disabled={cargando !== null}
            className={`${btn} border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
            {cargando === 'reactivar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Reiniciar prueba
          </button>
          <button onClick={() => ejecutar('eliminar', '¿Cancelar la prueba? Libera el RUT/correo. No borra sus datos ni su login.')} disabled={cargando !== null}
            className={`${btn} border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100`}>
            {cargando === 'eliminar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Cancelar prueba
          </button>
        </>
      )}

      {puedeEliminar && (
        <button
          onClick={() => ejecutar('purgar', `ELIMINAR DEFINITIVAMENTE a ${etiqueta || 'este usuario'}.\n\nSe borrarán TODOS sus datos (clientes, causas, honorarios, documentos) y su cuenta de acceso. Esta acción NO se puede deshacer.\n\n¿Continuar?`)}
          disabled={cargando !== null}
          className={`${btn} border border-red-300 bg-red-100 text-red-700 hover:bg-red-200`}>
          {cargando === 'purgar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Eliminar definitivamente
        </button>
      )}
    </div>
  )
}
