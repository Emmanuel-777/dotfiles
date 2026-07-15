import { db, initDB } from '@/lib/db'
import { plazos, tareas, citas, clientes, causas, honorarios, prospectos } from '@/lib/schema'
import { eq, and, gte, lte, lt, ne, or } from 'drizzle-orm'
import { getResend, buildNotificationEmail } from '@/lib/email'
import { formatFechaHoraChile, hoyChile, sumarDiasISO } from '@/lib/utils'
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
  const en3dias = sumarDiasISO(hoy, 3)
  // Límites superiores inclusivos: los campos en la base son ISO con hora
  // (ej. "2026-07-17T00:00:00.000Z"), así que compararlos como string contra
  // una fecha "pelada" (ej. "2026-07-17") los excluye por error — un
  // vencimiento justo el último día del rango nunca hacía match.
  const mañanaFin = `${mañana}T23:59:59.999Z`
  const en3diasFin = `${en3dias}T23:59:59.999Z`

  // Obtener todos los userIds con ítems pendientes
  const [plazosRows, tareasRows, citasRows, honorariosRows] = await Promise.all([
    db.select({ userId: plazos.userId }).from(plazos)
      .where(and(eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy), lte(plazos.fecha, en3diasFin))),
    db.select({ userId: tareas.userId }).from(tareas)
      .where(and(ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'), gte(tareas.fechaVencimiento, hoy), lte(tareas.fechaVencimiento, en3diasFin))),
    db.select({ userId: citas.userId }).from(citas)
      .where(and(or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')), gte(citas.fecha, hoy), lte(citas.fecha, mañanaFin))),
    db.select({ userId: honorarios.userId }).from(honorarios)
      .where(and(or(eq(honorarios.estado, 'PENDIENTE'), eq(honorarios.estado, 'PARCIAL')), lt(honorarios.fechaVence, hoy))),
  ])

  const seen = new Set<string>()
  const userIds: string[] = []
  for (const r of [...plazosRows, ...tareasRows, ...citasRows, ...honorariosRows]) {
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
      .select({ titulo: citas.titulo, horaInicio: citas.horaInicio, clienteNombre: clientes.nombre, prospectoNombre: prospectos.nombre })
      .from(citas)
      .leftJoin(clientes, eq(citas.clienteId, clientes.id))
      .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
      .where(and(eq(citas.userId, userId), or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')), eq(citas.fecha, hoy)))
      .orderBy(citas.horaInicio)

    // Citas de mañana
    const citasMañanaRows = await db
      .select({ titulo: citas.titulo, horaInicio: citas.horaInicio, clienteNombre: clientes.nombre, prospectoNombre: prospectos.nombre })
      .from(citas)
      .leftJoin(clientes, eq(citas.clienteId, clientes.id))
      .leftJoin(prospectos, eq(citas.prospectoId, prospectos.id))
      .where(and(eq(citas.userId, userId), or(eq(citas.estado, 'PENDIENTE'), eq(citas.estado, 'CONFIRMADA')), eq(citas.fecha, mañana)))
      .orderBy(citas.horaInicio)

    // Plazos próximos (hoy → 3 días)
    const plazosProximosRows = await db
      .select({ titulo: plazos.titulo, fecha: plazos.fecha, rol: causas.rol })
      .from(plazos)
      .leftJoin(causas, eq(plazos.causaId, causas.id))
      .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy), lte(plazos.fecha, en3diasFin)))
      .orderBy(plazos.fecha)

    // Tareas próximas (hoy → 3 días)
    const tareasProximasRows = await db
      .select({ titulo: tareas.titulo, fecha: tareas.fechaVencimiento })
      .from(tareas)
      .where(and(eq(tareas.userId, userId), ne(tareas.estado, 'COMPLETADA'), ne(tareas.estado, 'CANCELADA'), gte(tareas.fechaVencimiento, hoy), lte(tareas.fechaVencimiento, en3diasFin)))
      .orderBy(tareas.fechaVencimiento)

    // Honorarios vencidos sin pagar
    const honorariosVencidosRows = await db
      .select({ descripcion: honorarios.descripcion, monto: honorarios.monto, moneda: honorarios.moneda, fechaVence: honorarios.fechaVence, clienteNombre: clientes.nombre })
      .from(honorarios)
      .leftJoin(clientes, eq(honorarios.clienteId, clientes.id))
      .where(and(
        eq(honorarios.userId, userId),
        or(eq(honorarios.estado, 'PENDIENTE'), eq(honorarios.estado, 'PARCIAL')),
        lt(honorarios.fechaVence, hoy),
      ))
      .orderBy(honorarios.fechaVence)

    const totalItems = citasHoyRows.length + citasMañanaRows.length + plazosProximosRows.length + tareasProximasRows.length + honorariosVencidosRows.length
    if (totalItems === 0) continue

    const html = buildNotificationEmail({
      userName,
      citasHoy: citasHoyRows.map(c => ({ titulo: c.titulo, horaInicio: c.horaInicio, cliente: c.clienteNombre ?? c.prospectoNombre })),
      citasMañana: citasMañanaRows.map(c => ({ titulo: c.titulo, horaInicio: c.horaInicio, cliente: c.clienteNombre ?? c.prospectoNombre })),
      plazosProximos: plazosProximosRows.map(p => ({ titulo: p.titulo, fecha: p.fecha.split('T')[0], rol: p.rol })),
      tareasProximas: tareasProximasRows.filter(t => t.fecha).map(t => ({ titulo: t.titulo, fecha: formatFechaHoraChile(t.fecha!) })),
      honorariosVencidos: honorariosVencidosRows.map(h => ({
        descripcion: h.descripcion,
        monto: new Intl.NumberFormat('es-CL', { style: 'currency', currency: h.moneda ?? 'CLP', minimumFractionDigits: 0 }).format(h.monto),
        cliente: h.clienteNombre,
        fechaVence: h.fechaVence!.split('T')[0],
      })),
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
