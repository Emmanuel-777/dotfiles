'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// A los usuarios de prueba NO se les obliga a completar el perfil (incluida la
// cuenta bancaria) para explorar el CRM — eso solo aplica a cuentas permanentes,
// que necesitan esos datos para recibir pagos. Un trial entra y prueba libre.
export default function ProfileGuard({ perfilCompleto, esTrial = false }: { perfilCompleto: boolean; esTrial?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!perfilCompleto && !esTrial && pathname !== '/perfil') {
      router.replace('/perfil?requerido=1')
    }
  }, [perfilCompleto, esTrial, pathname, router])

  return null
}
