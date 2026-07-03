'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function ProfileGuard({ perfilCompleto }: { perfilCompleto: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!perfilCompleto && pathname !== '/perfil') {
      router.replace('/perfil?requerido=1')
    }
  }, [perfilCompleto, pathname, router])

  return null
}
