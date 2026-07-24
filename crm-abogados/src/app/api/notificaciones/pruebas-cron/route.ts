import { db, initDB } from '@/lib/db'
import { cuentas } from '@/lib/schema'
import { and, eq, gt, lte } from 'drizzle-orm'
import { getResend, buildPruebaVenceEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Aviso "tu prueba vence pronto" — corre a diario. Busca cuentas en prueba cuyo
// fin esté dentro de las próximas ~36h y que aún no recibieron el aviso.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  await initDB()

  const ahora = new Date()
  const ahoraISO = ahora.toISOString()
  const en36hISO = new Date(ahora.getTime() + 36 * 60 * 60 * 1000).toISOString()

  const porVencer = await db.select().from(cuentas).where(and(
    eq(cuentas.estado, 'trial'),
    eq(cuentas.recordatorioVencimiento, 0),
    gt(cuentas.trialFin, ahoraISO),
    lte(cuentas.trialFin, en36hISO),
  ))

  let enviados = 0
  for (const c of porVencer) {
    if (!c.email || !c.trialFin) continue
    try {
      const resend = getResend()
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
        to: c.email,
        subject: 'Tu prueba de LexCRM termina pronto',
        html: buildPruebaVenceEmail({ nombre: c.nombre ?? '', trialFin: c.trialFin }),
      })
      if (error) throw new Error(JSON.stringify(error))
      await db.update(cuentas).set({ recordatorioVencimiento: 1 }).where(eq(cuentas.userId, c.userId))
      enviados++
    } catch (e) {
      console.error(`Error enviando aviso de vencimiento a ${c.email}:`, e)
    }
  }

  return Response.json({ ok: true, revisados: porVencer.length, enviados })
}
