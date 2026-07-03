import { db, initDB } from '@/lib/db'
import { tareas } from '@/lib/schema'
import { eq, ne, and } from 'drizzle-orm'
import { getResend, buildTareasPendientesEmail } from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  await initDB()

  const pendientes = await db
    .select({ userId: tareas.userId })
    .from(tareas)
    .where(and(ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA')))

  const seen = new Set<string>()
  const userIds: string[] = []
  for (const r of pendientes) {
    if (r.userId && !seen.has(r.userId)) { seen.add(r.userId); userIds.push(r.userId) }
  }

  const clerk = await clerkClient()
  const resend = getResend()
  let enviados = 0

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

    const rows = await db
      .select({ titulo: tareas.titulo, fechaVencimiento: tareas.fechaVencimiento, prioridad: tareas.prioridad })
      .from(tareas)
      .where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA')))
      .orderBy(tareas.fechaVencimiento)

    if (rows.length === 0) continue

    const html = buildTareasPendientesEmail({ userName, tareas: rows })

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
        to: userEmail,
        subject: `📋 Tienes ${rows.length} ${rows.length === 1 ? 'tarea pendiente' : 'tareas pendientes'} — LexCRM`,
        html,
      })
      enviados++
    } catch (e) {
      console.error(`Error enviando tareas pendientes a ${userEmail}:`, e)
    }
  }

  return Response.json({ ok: true, enviados, usuarios: userIds.length })
}
