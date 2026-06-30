import { NextRequest, NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { citas, clientes, causas, prospectos } from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'
import { getResend, buildCitaConfirmationEmail } from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial', MEET: 'Google Meet', ZOOM: 'Zoom', TELEFONICA: 'Telefónica',
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')
  const causaId = searchParams.get('causaId')

  const rows = await db
    .select({ cita: citas, cliente: clientes, causa: causas })
    .from(citas)
    .leftJoin(clientes, eq(citas.clienteId, clientes.id))
    .leftJoin(causas, eq(citas.causaId, causas.id))
    .where(eq(citas.userId, userId))
    .orderBy(desc(citas.fecha))

  let result = rows
  if (clienteId) result = result.filter((r) => r.cita.clienteId === clienteId)
  if (causaId) result = result.filter((r) => r.cita.causaId === causaId)

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()

  if (!body.clienteId && !body.prospectoId) {
    return NextResponse.json({ error: 'La cita debe asociarse a un cliente o prospecto existente' }, { status: 400 })
  }

  const id = nanoid()

  const nueva = {
    id,
    userId,
    titulo: body.titulo,
    descripcion: body.descripcion ?? null,
    clienteId: body.clienteId || null,
    prospectoId: body.prospectoId || null,
    causaId: body.causaId || null,
    fecha: body.fecha,
    horaInicio: body.horaInicio,
    horaFin: body.horaFin ?? null,
    tipo: body.tipo ?? 'PRESENCIAL',
    linkReunion: body.linkReunion ?? null,
    esGratuita: body.esGratuita ? 1 : 0,
    valor: body.esGratuita ? null : (body.valor ? Number(body.valor) : null),
    estado: body.estado ?? 'PENDIENTE',
    notas: body.notas ?? null,
  }

  await db.insert(citas).values(nueva)

  // Correo de confirmación al cliente/prospecto — best effort, no bloquea la creación
  try {
    const contacto = nueva.clienteId
      ? (await db.select({ nombre: clientes.nombre, email: clientes.email }).from(clientes).where(eq(clientes.id, nueva.clienteId)).limit(1))[0]
      : (await db.select({ nombre: prospectos.nombre, email: prospectos.email }).from(prospectos).where(eq(prospectos.id, nueva.prospectoId!)).limit(1))[0]

    if (contacto?.email) {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const abogadoNombre = user.firstName ?? 'tu abogado/a'

      const html = buildCitaConfirmationEmail({
        contactoNombre: contacto.nombre,
        abogadoNombre,
        titulo: nueva.titulo,
        fecha: nueva.fecha,
        horaInicio: nueva.horaInicio,
        horaFin: nueva.horaFin,
        tipoLabel: TIPO_LABELS[nueva.tipo] ?? nueva.tipo,
        linkReunion: nueva.linkReunion,
      })

      const resend = getResend()
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
        to: contacto.email,
        subject: `Confirmación de cita — ${nueva.titulo}`,
        html,
      })
    }
  } catch (err) {
    console.error('Error enviando correo de confirmación de cita:', err)
  }

  return NextResponse.json({ id }, { status: 201 })
}
