import DashboardShell from '@/components/DashboardShell'
import AsistenteVirtual from '@/components/AsistenteVirtual'
import { db, initDB } from '@/lib/db'
import { plazos, tareas, citas, prospectos } from '@/lib/schema'
import { eq, and, ne, gte, lte, isNull } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    await initDB()
  } catch (e) {
    console.error('[initDB] Error:', e)
    throw e
  }

  // Semáforo de alertas para el sidebar
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hoyISO = hoy.toISOString()
  const en3dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const finDiaISO = new Date(hoy.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const [plazosRows, tareasRows, citasRows, prospectosRows] = await Promise.all([
    db.select({ fecha: plazos.fecha }).from(plazos)
      .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'))),
    db.select({ fecha: tareas.fechaVencimiento }).from(tareas)
      .where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'))),
    db.select({ id: citas.id }).from(citas)
      .where(and(
        eq(citas.userId, userId),
        eq(citas.estado, 'PROGRAMADA'),
        gte(citas.fecha, hoyISO.split('T')[0]),
        lte(citas.fecha, finDiaISO.split('T')[0]),
      )),
    db.select({ fecha: prospectos.proximoContacto }).from(prospectos)
      .where(and(
        eq(prospectos.userId, userId),
        ne(prospectos.etapa, 'GANADO'),
        ne(prospectos.etapa, 'PERDIDO'),
        isNull(prospectos.clienteId),
      )),
  ])

  // Los recordatorios del embudo se guardan como fecha (YYYY-MM-DD)
  const hoyFecha = hoyISO.split('T')[0]
  const en3Fecha = en3dias.split('T')[0]

  const plazosVencidos = plazosRows.filter((p) => p.fecha && p.fecha < hoyISO).length
  const plazosCriticos = plazosRows.filter((p) => p.fecha && p.fecha >= hoyISO && p.fecha <= en3dias).length
  const tareasVencidas = tareasRows.filter((t) => t.fecha && t.fecha < hoyISO).length
  const tareasCriticas = tareasRows.filter((t) => t.fecha && t.fecha >= hoyISO && t.fecha <= en3dias).length
  const citasHoy = citasRows.length
  const embudoVencidos = prospectosRows.filter((p) => p.fecha && p.fecha < hoyFecha).length
  const embudoCriticos = prospectosRows.filter((p) => p.fecha && p.fecha >= hoyFecha && p.fecha <= en3Fecha).length

  const alertas = {
    agenda: { vencidos: plazosVencidos, criticos: plazosCriticos },
    tareas: { vencidos: tareasVencidas, criticos: tareasCriticas },
    citas: { hoy: citasHoy },
    embudo: { vencidos: embudoVencidos, criticos: embudoCriticos },
  }

  return (
    <DashboardShell alertas={alertas}>
      {children}
      <AsistenteVirtual />
    </DashboardShell>
  )
}
