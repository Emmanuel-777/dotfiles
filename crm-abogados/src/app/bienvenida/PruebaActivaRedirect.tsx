'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

// Decodifica el payload de un JWT (base64url) sin librerías.
function payloadDe(jwt: string): Record<string, unknown> | null {
  try {
    const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(b64))))
  } catch {
    return null
  }
}

function tokenTraeTrial(jwt: string | null): boolean {
  if (!jwt) return false
  const p = payloadDe(jwt)
  const meta = p?.metadata as { estado?: string } | undefined
  return !!meta?.estado
}

// La cuenta de prueba ya existe, pero el token de sesión puede tardar unos
// segundos en reflejar el metadata nuevo. Forzamos refrescos del token hasta
// que aparezca, y recién ahí entramos al CRM (evita el bucle a /bienvenida).
export default function PruebaActivaRedirect() {
  const { getToken } = useAuth()
  const [manual, setManual] = useState(false)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      for (let intento = 0; intento < 12 && !cancelado; intento++) {
        try {
          const t = await getToken({ skipCache: true })
          if (tokenTraeTrial(t)) {
            window.location.assign('/dashboard')
            return
          }
        } catch {
          /* reintentar */
        }
        await new Promise((r) => setTimeout(r, 1200))
      }
      if (!cancelado) setManual(true)
    })()
    return () => { cancelado = true }
  }, [getToken])

  return (
    <div className="text-center py-6">
      <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-[#14254c]" />
      <p className="text-sm font-medium text-gray-800">Activando tu prueba…</p>
      <p className="text-xs text-gray-500 mt-1">Un momento, ya casi entras.</p>
      {manual && (
        <button
          onClick={() => window.location.assign('/dashboard')}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#14254c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a3060]"
        >
          Entrar al CRM
        </button>
      )}
    </div>
  )
}
