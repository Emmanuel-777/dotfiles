import { db, initDB } from '@/lib/db'
import { solicitudesAcceso } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getResend, buildSolicitudAccesoEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''
  if (!email) return Response.json({ ok: false, error: 'email requerido' }, { status: 400 })

  await initDB()

  const [existente] = await db.select().from(solicitudesAcceso).where(eq(solicitudesAcceso.email, email))

  const ahora = new Date()
  const debeAvisar = !existente?.ultimoAviso
    || (ahora.getTime() - new Date(existente.ultimoAviso).getTime()) >= VEINTICUATRO_HORAS_MS

  const intentos = (existente?.intentos ?? 0) + 1

  if (existente) {
    await db.update(solicitudesAcceso)
      .set({ intentos, ...(debeAvisar ? { ultimoAviso: ahora.toISOString() } : {}) })
      .where(eq(solicitudesAcceso.email, email))
  } else {
    await db.insert(solicitudesAcceso).values({ email, intentos: 1, ultimoAviso: ahora.toISOString() })
  }

  let enviado = false
  if (debeAvisar) {
    try {
      const resend = getResend()
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
        to: 'contacto@lexcrm.site',
        subject: `🔔 ${email} quiere acceder a LexCRM`,
        html: buildSolicitudAccesoEmail({ email, intentos }),
      })
      if (error) throw new Error(JSON.stringify(error))
      enviado = true
    } catch (e) {
      console.error(`Error enviando aviso de solicitud de acceso para ${email}:`, e)
    }
  }

  return Response.json({ ok: true, enviado })
}
