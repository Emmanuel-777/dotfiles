import { db, initDB } from '@/lib/db'
import { citas, clientes, prospectos } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'
import { getResend, buildCitaReminderEmail } from '@/lib/email'
import { hoyChile, sumarDiasISO } from '@/lib/utils'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  await initDB()

  const hoy = hoyChile()
  const mañana = sumarDiasISO(hoy, 1)

  // Citas de mañana que aún no recibieron recordatorio nocturno
  const pendientes = await db
    .select({ userId: citas.userId })
    .from(citas)
    .where(and(
      eq(citas.fecha, mañana),
      or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')),
      eq(citas.recordatorioCitaEnviado, 0),
    ))

  const seen = new Set<string>()
  const userIds: string[] = []
  for (const r of pendientes) {
    if (r.userId && !seen.has(r.userId)) { seen.add(r.userId); userIds.push(r.userId) }
  }

  const clerk = await clerkClient()
  const resend = getResend()
  let enviados = 0
  let citasNotificadas = 0

  for (const userId of userIds) {
    let userEmail: string | undefined
    let userName = 'Abogado/a'
    try {
      const user = await clerk.users.getUser(userId)
      userEmail = user.emailAddresses[0]?.emailAddress
      userName = user.firstName ?? userEmail ?? 'Abogado/a'
    } catch {
      continue
    }
    if (!userEmail) continue

    // Citas de mañana con detalle de contacto
    const rows = await db
      .select({
        id:           citas.id,
        titulo:       citas.titulo,
        horaInicio:   citas.horaInicio,
        horaFin:      citas.horaFin,
        tipo:         citas.tipo,
        linkReunion:  citas.linkReunion,
        clienteNombre:   clientes.nombre,
        prospectoNombre: prospectos.nombre,
      })
      .from(citas)
      .leftJoin(clientes, eq(citas.clienteId, clientes.id))
      .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
      .where(and(
        eq(citas.userId, userId),
        eq(citas.fecha, mañana),
        or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')),
        eq(citas.recordatorioCitaEnviado, 0),
      ))
      .orderBy(citas.horaInicio)

    if (rows.length === 0) continue

    const html = buildCitaReminderEmail({
      userName,
      fechaMañana: mañana,
      citas: rows.map(r => ({
        titulo:      r.titulo,
        horaInicio:  r.horaInicio,
        horaFin:     r.horaFin,
        tipo:        r.tipo,
        contacto:    r.clienteNombre ?? r.prospectoNombre,
        linkReunion: r.linkReunion,
      })),
    })

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
        to: userEmail,
        subject: `⏰ Mañana tienes ${rows.length} ${rows.length === 1 ? 'cita' : 'citas'} — LexCRM`,
        html,
      })

      // Marcar como notificadas para no reenviar
      for (const row of rows) {
        await db.update(citas)
          .set({ recordatorioCitaEnviado: 1 })
          .where(eq(citas.id, row.id))
      }

      enviados++
      citasNotificadas += rows.length
    } catch (e) {
      console.error(`Error enviando recordatorio a ${userEmail}:`, e)
    }
  }

  return Response.json({ ok: true, enviados, citasNotificadas })
}
