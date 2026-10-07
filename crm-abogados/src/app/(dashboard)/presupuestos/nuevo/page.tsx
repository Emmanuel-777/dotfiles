import { notFound } from 'next/navigation'
import { presupuestosHabilitados } from '@/lib/presupuestos/flag'
import PresupuestoEditor from '@/components/presupuestos/PresupuestoEditor'

export const dynamic = 'force-dynamic'

export default function NuevoPresupuestoPage() {
  if (!presupuestosHabilitados()) notFound()
  return <PresupuestoEditor />
}
