import { notFound } from 'next/navigation'
import { requireUserId } from '@/lib/auth'
import { presupuestosHabilitados } from '@/lib/presupuestos/flag'
import { obtenerPresupuesto } from '@/lib/presupuestos/repo'
import PresupuestoEditor from '@/components/presupuestos/PresupuestoEditor'

export const dynamic = 'force-dynamic'

export default async function PresupuestoPage({ params }: { params: { id: string } }) {
  if (!presupuestosHabilitados()) notFound()
  const userId = await requireUserId()
  const inicial = await obtenerPresupuesto(userId, params.id)
  if (!inicial) notFound()
  return <PresupuestoEditor inicial={JSON.parse(JSON.stringify(inicial))} />
}
