import { db, initDB } from '@/lib/db'
import { tareas, perfilAbogado } from '@/lib/schema'
import { eq, and, ne, isNotNull } from 'drizzle-orm'
import { sendWhatsApp, isWhatsappConfigured } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  await initDB()

  if (!isWhatsappConfigured()) {
    return Response.json({ ok: true, enviados: 0, motivo: 'WhatsApp no configurado (faltan credenciales de Twilio)' })
  }

  const perfiles = await db
    .select({ userId: perfilAbogado.userId, whatsapp: perfilAbogado.whatsapp })
    .from(perfilAbogado)
    .where(and(
      eq(perfilAbogado.perfilCompleto, 1),
      eq(perfilAbogado.notificacionesWhatsapp, 1),
      isNotNull(perfilAbogado.whatsapp),
    ))

  let enviados = 0

  for (const perfil of perfiles) {
    if (!perfil.whatsapp) continue

    const pendientes = await db
      .select({ titulo: tareas.titulo, fechaVencimiento: tareas.fechaVencimiento })
      .from(tareas)
      .where(and(
        eq(tareas.userId, perfil.userId),
        ne(tareas.estado, 'COMPLETADA'),
        ne(tareas.estado, 'CANCELADA'),
      ))
      .orderBy(tareas.fechaVencimiento)

    if (pendientes.length === 0) continue

    const listado = pendientes.slice(0, 5).map((t) => {
      const fecha = t.fechaVencimiento ? ` (vence ${t.fechaVencimiento.split('T')[0]})` : ''
      return `• ${t.titulo}${fecha}`
    }).join('\n')
    const extra = pendientes.length > 5 ? `\n…y ${pendientes.length - 5} más` : ''

    const mensaje = `📋 *LexCRM* — Tienes ${pendientes.length} ${pendientes.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}:\n\n${listado}${extra}`

    const ok = await sendWhatsApp(perfil.whatsapp, mensaje)
    if (ok) enviados++
  }

  return Response.json({ ok: true, enviados, revisados: perfiles.length })
}
