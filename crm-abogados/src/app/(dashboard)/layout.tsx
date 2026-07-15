import DashboardShell from '@/components/DashboardShell'
import AsistenteVirtual from '@/components/AsistenteVirtual'
import ProfileGuard from '@/components/ProfileGuard'
import { db, initDB } from '@/lib/db'
import { plazos, tareas, citas, prospectos, perfilAbogado } from '@/lib/schema'
import { eq, and, ne, gte, lte, isNull, or } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { hoyChile, sumarDiasISO } from '@/lib/utils'

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

  // Semáforo de alertas para el sidebar — usa el "hoy" real de Chile, no el
  // del servidor (Vercel corre en UTC, que de noche en Chile ya está en el
  // día siguiente y adelanta vencimientos varias horas antes de tiempo).
  const hoyFechaChile = hoyChile()
  const hoyISO = `${hoyFechaChile}T00:00:00.000Z`
  const en3Fecha = sumarDiasISO(hoyFechaChile, 3)
  const en3dias = `${en3Fecha}T00:00:00.000Z`
  const mananaFecha = sumarDiasISO(hoyFechaChile, 1)

  const [plazosRows, tareasRows, citasRows, prospectosRows, perfilRows] = await Promise.all([
    db.select({ fecha: plazos.fecha }).from(plazos)
      .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'))),
    db.select({ fecha: tareas.fechaVencimiento }).from(tareas)
      .where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'))),
    db.select({ id: citas.id }).from(citas)
      .where(and(
        eq(citas.userId, userId),
        or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')),
        gte(citas.fecha, hoyFechaChile),
        lte(citas.fecha, mananaFecha),
      )),
    db.select({ fecha: prospectos.proximoContacto }).from(prospectos)
      .where(and(
        eq(prospectos.userId, userId),
        ne(prospectos.etapa, 'GANADO'),
        ne(prospectos.etapa, 'PERDIDO'),
        isNull(prospectos.clienteId),
      )),
    db.select({ perfilCompleto: perfilAbogado.perfilCompleto }).from(perfilAbogado)
      .where(eq(perfilAbogado.userId, userId)),
  ])

  const perfilCompleto = (perfilRows[0]?.perfilCompleto ?? 0) === 1

  const plazosVencidos = plazosRows.filter((p) => p.fecha && p.fecha < hoyISO).length
  const plazosCriticos = plazosRows.filter((p) => p.fecha && p.fecha >= hoyISO && p.fecha <= en3dias).length
  const tareasVencidas = tareasRows.filter((t) => t.fecha && t.fecha < hoyISO).length
  const tareasCriticas = tareasRows.filter((t) => t.fecha && t.fecha >= hoyISO && t.fecha <= en3dias).length
  const citasHoy = citasRows.length
  // Los recordatorios del embudo se guardan como fecha (YYYY-MM-DD)
  const embudoVencidos = prospectosRows.filter((p) => p.fecha && p.fecha < hoyFechaChile).length
  const embudoCriticos = prospectosRows.filter((p) => p.fecha && p.fecha >= hoyFechaChile && p.fecha <= en3Fecha).length

  const alertas = {
    agenda: { vencidos: plazosVencidos, criticos: plazosCriticos },
    tareas: { vencidos: tareasVencidas, criticos: tareasCriticas },
    citas: { hoy: citasHoy },
    embudo: { vencidos: embudoVencidos, criticos: embudoCriticos },
  }

  return (
    <DashboardShell alertas={alertas} perfilCompleto={perfilCompleto}>
      <ProfileGuard perfilCompleto={perfilCompleto} />
      {children}
      <AsistenteVirtual />
    </DashboardShell>
  )
}
