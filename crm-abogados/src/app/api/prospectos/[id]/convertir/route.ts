import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { prospectos, clientes } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'
import { getUserId } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [prospecto] = await db
    .select()
    .from(prospectos)
    .where(and(eq(prospectos.id, params.id), eq(prospectos.userId, userId)))
  if (!prospecto) return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 })
  if (prospecto.clienteId) {
    return NextResponse.json({ error: 'Este prospecto ya fue convertido en cliente' }, { status: 409 })
  }

  const body = await req.json()
  const { rut, nombre, tipo, email, telefono, celular, direccion, ciudad, region, notas } = body
  if (!rut || !nombre) {
    return NextResponse.json({ error: 'RUT y nombre son requeridos' }, { status: 400 })
  }

  // RUT único global (constraint en DB no está acotado por userId)
  const [existente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.rut, rut))
  if (existente) {
    return NextResponse.json({ error: 'Ya existe un cliente con ese RUT' }, { status: 409 })
  }

  const clienteId = nanoid()
  const now = new Date().toISOString()
  try {
    await db.insert(clientes).values({
      id: clienteId,
      userId,
      rut,
      nombre,
      tipo: tipo || 'PERSONA_NATURAL',
      email: email || null,
      telefono: telefono || null,
      celular: celular || null,
      direccion: direccion || null,
      ciudad: ciudad || 'Santiago',
      region: region || 'Región Metropolitana',
      notas: notas || null,
      createdAt: now,
      updatedAt: now,
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo crear el cliente. Verifica que el RUT no esté duplicado.' }, { status: 409 })
  }

  // Vincular prospecto y asegurar etapa GANADO
  await db
    .update(prospectos)
    .set({ clienteId, etapa: 'GANADO', updatedAt: now })
    .where(and(eq(prospectos.id, params.id), eq(prospectos.userId, userId)))

  return NextResponse.json({ clienteId }, { status: 201 })
}
