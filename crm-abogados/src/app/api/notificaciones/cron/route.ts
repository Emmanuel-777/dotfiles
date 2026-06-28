import { db, initDB } from '@/lib/db'
import { plazos, tareas, citas, clientes, causas } from '@/lib/schema'
import { eq, and, gte, lte, ne } from 'drizzle-orm'
import { getResend, buildNotificationEmail } from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function chileToday(): string {
  // Chile winter UTC-4, summer UTC-3. Using UTC-4 to be safe.
  const now = new Date()
  const chile = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  return chile.toISOString().split('T')[0]
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }

  await initDB()

  const hoy = chileToday()
  const mañana = addDays(hoy, 1)
  const en3dias = addDays(hoy, 3)

  // Obtener todos los userIds con citas o plazos próximos
  const [plazosRows, tareasRows, citasRows] = await Promise.all([
    db.select({ userId: plazos.userId }).from(plazos)
      .where(and(eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy), lte(plazos.fecha, en3dias))),
    db.select({ userId: tareas.userId }).from(tareas)
      .where(and(ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'), gte(tareas.fechaVencimiento, hoy), lte(tareas.fechaVencimiento, en3dias))),
    db.select({ userId: citas.userId }).from(citas)
      .where(and(eq(citas.estado, 'PROGRAMADA'), gte(citas.fecha, hoy), lte(citas.fecha, mañana))),
  ])

  const seen = new Set<string>()
  const userIds: string[] = []
  for (const r of [...plazosRows, ...tareasRows, ...citasRows]) {
    if (r.userId && !seen.has(r.userId)) { seen.add(r.userId); userIds.push(r.userId) }
  }

  const client = await clerkClient()
  const resend = getResend()
  let enviados = 0

  for (const userId of userIds) {
    // Obtener email del usuario desde Clerk
    let userEmail: string | undefined
    let userName = 'Abogado/a'
    try {
      const user = await client.users.getUser(userId)
      userEmail = user.emailAddresses[0]?.emailAddress
      userName = user.firstName ?? userEmail ?? 'Abogado/a'
    } catch {
      continue
    }
    if (!userEmail) continue

    // Citas de hoy
    const citasHoyRows = await db
      .select({ titulo: citas.titulo, horaInicio: citas.horaInicio, clienteNombre: clientes.nombre })
      .from(citas)
      .leftJoin(clientes, eq(citas.clienteId, clientes.id))
      .where(and(eq(citas.userId, userId), eq(citas.estado, 'PROGRAMADA'), eq(citas.fecha, hoy)))
      .orderBy(citas.horaInicio)

    // Citas de mañana
    const citasMañanaRows = await db
      .select({ titulo: citas.titulo, horaInicio: citas.horaInicio, clienteNombre: clientes.nombre })
      .from(citas)
      .leftJoin(clientes, eq(citas.clienteId, clientes.id))
      .where(and(eq(citas.userId, userId), eq(citas.estado, 'PROGRAMADA'), eq(citas.fecha, mañana)))
      .orderBy(citas.horaInicio)

    // Plazos próximos (hoy → 3 días)
    const plazosProximosRows = await db
      .select({ titulo: plazos.titulo, fecha: plazos.fecha, rol: causas.rol })
      .from(plazos)
      .leftJoin(causas, eq(plazos.causaId, causas.id))
      .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy), lte(plazos.fecha, en3dias)))
      .orderBy(plazos.fecha)

    // Tareas próximas (hoy → 3 días)
    const tareasProximasRows = await db
      .select({ titulo: tareas.titulo, fecha: tareas.fechaVencimiento })
      .from(tareas)
      .where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'), gte(tareas.fechaVencimiento, hoy), lte(tareas.fechaVencimiento, en3dias)))
      .orderBy(tareas.fechaVencimiento)

    const totalItems = citasHoyRows.length + citasMañanaRows.length + plazosProximosRows.length + tareasProximasRows.length
    if (totalItems === 0) continue

    const html = buildNotificationEmail({
      userName,
      citasHoy: citasHoyRows.map(c => ({ titulo: c.titulo, horaInicio: c.horaInicio, cliente: c.clienteNombre })),
      citasMañana: citasMañanaRows.map(c => ({ titulo: c.titulo, horaInicio: c.horaInicio, cliente: c.clienteNombre })),
      plazosProximos: plazosProximosRows.map(p => ({ titulo: p.titulo, fecha: p.fecha.split('T')[0], rol: p.rol })),
      tareasProximas: tareasProximasRows.filter(t => t.fecha).map(t => ({ titulo: t.titulo, fecha: t.fecha!.split('T')[0] })),
    })

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
      to: userEmail,
      subject: `📋 LexCRM — ${totalItems} ${totalItems === 1 ? 'ítem pendiente' : 'ítems pendientes'} para hoy`,
      html,
    })

    enviados++
  }

  return Response.json({ ok: true, enviados, usuarios: userIds.length })
}
