import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, initDB } from '@/lib/db'
import { clientes, causas, plazos, tareas } from '@/lib/schema'
import { getUserId } from '@/lib/auth'
import { nanoid } from '@/lib/nanoid'
import { hoyChile, sumarDiasISO } from '@/lib/utils'

// RUT plausible y aleatorio (la columna clientes.rut es única a nivel global,
// así que no podemos usar RUTs fijos entre distintas cuentas de ejemplo).
function rutAleatorio(): string {
  const cuerpo = 15000000 + Math.floor(Math.random() * 9000000)
  const dv = Math.floor(Math.random() * 10)
  return `${cuerpo}-${dv}`
}

export async function POST() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // No sembrar si ya tiene clientes (evita duplicar sobre datos reales).
  const [existe] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, userId)).limit(1)
  if (existe) return NextResponse.json({ ok: true, yaTenia: true })

  const now = new Date().toISOString()
  const hoy = hoyChile()

  const cli1 = nanoid()
  const cli2 = nanoid()
  await db.insert(clientes).values([
    {
      id: cli1, userId, rut: rutAleatorio(), nombre: 'María González (ejemplo)',
      tipo: 'PERSONA_NATURAL', email: 'maria.ejemplo@correo.cl', celular: '+56 9 1111 1111',
      ciudad: 'Concepción', region: 'Biobío', notas: 'Cliente de ejemplo — puedes eliminarlo.',
      createdAt: now, updatedAt: now,
    },
    {
      id: cli2, userId, rut: rutAleatorio(), nombre: 'Constructora Andes SpA (ejemplo)',
      tipo: 'EMPRESA', email: 'contacto@andes-ejemplo.cl', celular: '+56 9 2222 2222',
      ciudad: 'Concepción', region: 'Biobío', notas: 'Cliente de ejemplo — puedes eliminarlo.',
      createdAt: now, updatedAt: now,
    },
  ])

  const causa1 = nanoid()
  const causa2 = nanoid()
  await db.insert(causas).values([
    {
      id: causa1, userId, rol: 'C-1234-2026', tribunal: '1º Juzgado de Letras de Concepción',
      tipoCausa: 'Civil', materia: 'Cobro de pesos', estado: 'EN_TRAMITE', fechaIngreso: hoy,
      contraparte: 'Inversiones del Sur Ltda.', abogadoResponsable: 'Tú',
      descripcion: 'Causa de ejemplo para explorar el CRM.', clienteId: cli1, createdAt: now, updatedAt: now,
    },
    {
      id: causa2, userId, rol: 'O-663-2026', tribunal: 'Juzgado de Letras del Trabajo de Concepción',
      tipoCausa: 'Laboral', materia: 'Despido injustificado', estado: 'EN_TRAMITE', fechaIngreso: hoy,
      contraparte: 'Comercial Pacífico S.A.', abogadoResponsable: 'Tú',
      descripcion: 'Causa de ejemplo para explorar el CRM.', clienteId: cli2, createdAt: now, updatedAt: now,
    },
  ])

  await db.insert(plazos).values([
    {
      id: nanoid(), userId, titulo: 'Contestar demanda', tipo: 'VENCIMIENTO', estado: 'PENDIENTE',
      fecha: `${sumarDiasISO(hoy, 5)}T09:00:00.000Z`, notas: 'Plazo de ejemplo.', causaId: causa1,
      createdAt: now, updatedAt: now,
    },
    {
      id: nanoid(), userId, titulo: 'Audiencia preparatoria', tipo: 'AUDIENCIA', estado: 'PENDIENTE',
      fecha: `${sumarDiasISO(hoy, 12)}T10:30:00.000Z`, notas: 'Audiencia de ejemplo.', causaId: causa2,
      createdAt: now, updatedAt: now,
    },
  ])

  await db.insert(tareas).values([
    {
      id: nanoid(), userId, titulo: 'Revisar expediente y preparar escrito', prioridad: 'ALTA',
      estado: 'PENDIENTE', fechaVencimiento: `${sumarDiasISO(hoy, 2)}T18:00:00.000Z`,
      clienteId: cli1, causaId: causa1, createdAt: now, updatedAt: now,
    },
    {
      id: nanoid(), userId, titulo: 'Llamar al cliente para actualizar', prioridad: 'MEDIA',
      estado: 'PENDIENTE', fechaVencimiento: `${sumarDiasISO(hoy, 3)}T12:00:00.000Z`,
      clienteId: cli2, causaId: causa2, createdAt: now, updatedAt: now,
    },
  ])

  return NextResponse.json({ ok: true })
}
