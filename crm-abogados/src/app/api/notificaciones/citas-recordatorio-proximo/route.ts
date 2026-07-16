import { db, initDB } from '@/lib/db'
import { citas, clientes, prospectos } from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'
import { getResend, buildCitaRecordatorioProximoEmail } from '@/lib/email'
import { hoyChile } from '@/lib/utils'
import { fromZonedTime } from 'date-fns-tz'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  PRESENCIAL: '📍 Presencial', MEET: '📹 Google Meet', ZOOM: '📹 Zoom', TELEFONICA: '📞 Telefónica',
}

/**
 * Llamado cada 15 minutos por un workflow externo (GitHub Actions) —
 * Vercel Hobby no permite crons más frecuentes que una vez al día. Revisa
 * las citas de hoy y avisa al abogado 1 hora y 30 minutos antes, sin
 * importar el estado (Pendiente o Confirmada) — solo excluye canceladas
 * y ya completadas.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  await initDB()

  const hoy = hoyChile()
  const rows = await db
    .select({
      cita: citas,
      clienteNombre: clientes.nombre,
      prospectoNombre: prospectos.nombre,
    })
    .from(citas)
    .leftJoin(clientes, eq(citas.clienteId, clientes.id))
    .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
    .where(and(
      eq(citas.fecha, hoy),
      or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')),
      or(eq(citas.recordatorio1hEnviado, 0), eq(citas.recordatorio30minEnviado, 0)),
    ))

  if (rows.length === 0) return Response.json({ ok: true, revisadas: 0, enviados: 0 })

  const ahora = Date.now()
  const clerk = await clerkClient()
  const resend = getResend()
  const cache = new Map<string, { nombre: string; email?: string }>()
  let enviados = 0

  for (const { cita, clienteNombre, prospectoNombre } of rows) {
    const citaInstant = fromZonedTime(`${cita.fecha}T${cita.horaInicio}:00`, 'America/Santiago')
    const minutosRestantes = (citaInstant.getTime() - ahora) / 60000

    const necesita1h = minutosRestantes <= 60 && minutosRestantes > 30 && cita.recordatorio1hEnviado === 0
    const necesita30min = minutosRestantes <= 30 && minutosRestantes >= 0 && cita.recordatorio30minEnviado === 0
    if (!necesita1h && !necesita30min) continue

    if (!cache.has(cita.userId)) {
      try {
        const user = await clerk.users.getUser(cita.userId)
        cache.set(cita.userId, { nombre: user.firstName ?? 'Abogado/a', email: user.emailAddresses[0]?.emailAddress })
      } catch {
        cache.set(cita.userId, { nombre: 'Abogado/a', email: undefined })
      }
    }
    const abogado = cache.get(cita.userId)!
    if (!abogado.email) continue

    const minutosRestantesTipo: 60 | 30 = necesita1h ? 60 : 30

    try {
      const html = buildCitaRecordatorioProximoEmail({
        userName: abogado.nombre,
        contactoNombre: clienteNombre ?? prospectoNombre ?? 'Contacto sin nombre',
        titulo: cita.titulo,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        tipoLabel: TIPO_LABEL[cita.tipo] ?? cita.tipo,
        linkReunion: cita.linkReunion,
        minutosRestantes: minutosRestantesTipo,
      })

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
        to: abogado.email,
        subject: `⏰ Tu cita "${cita.titulo}" es en ${minutosRestantesTipo === 60 ? '1 hora' : '30 minutos'}`,
        html,
      })

      await db.update(citas)
        .set(necesita1h ? { recordatorio1hEnviado: 1 } : { recordatorio30minEnviado: 1 })
        .where(eq(citas.id, cita.id))

      enviados++
    } catch (e) {
      console.error(`Error enviando recordatorio próximo de cita ${cita.id}:`, e)
    }
  }

  return Response.json({ ok: true, revisadas: rows.length, enviados })
}
