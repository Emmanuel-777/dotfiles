import { getUserId } from '@/lib/auth'
import { db, initDB } from '@/lib/db'
import { causas, clientes, plazos } from '@/lib/schema'
import { eq, and, gte, ne } from 'drizzle-orm'
import { registrarAuditoria } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const ESTADOS: Record<string, string> = {
  EN_TRAMITE: 'En tramitación',
  TERMINADA: 'Terminada',
  SUSPENDIDA: 'Suspendida',
  ARCHIVADA: 'Archivada',
}

function cel(val: string | null | undefined): string {
  const s = (val ?? '').trim()
  return s.includes(';') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return new Response('No autorizado', { status: 401 })

  await initDB()

  // Las causas Penales quedan excluidas de la exportación masiva (Ley 21.719,
  // Arts. 24-25 — prohibición de tratamiento masivo de datos de infracciones penales).
  const rows = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(and(eq(causas.userId, userId), ne(causas.tipoCausa, 'Penal')))
    .orderBy(causas.rol)

  const hoy = new Date().toISOString()
  const proximosPlazos = await db
    .select()
    .from(plazos)
    .where(and(eq(plazos.userId, userId), eq(plazos.estado, 'PENDIENTE'), gte(plazos.fecha, hoy)))
    .orderBy(plazos.fecha)

  const plazosPorCausa: Record<string, string> = {}
  for (const p of proximosPlazos) {
    if (!plazosPorCausa[p.causaId]) {
      plazosPorCausa[p.causaId] = `${p.titulo} (${p.fecha})`
    }
  }

  const headers = [
    'Rol/RIT', 'Cliente', 'RUT', 'Tribunal', 'Tipo de causa', 'Materia',
    'Estado', 'Fecha ingreso', 'Contraparte', 'Abogado responsable',
    'Próximo plazo', 'Descripción',
  ]

  const lineas = [
    headers.join(';'),
    ...rows.map(({ causa, cliente }) =>
      [
        cel(causa.rol),
        cel(cliente?.nombre),
        cel(cliente?.rut),
        cel(causa.tribunal),
        cel(causa.tipoCausa),
        cel(causa.materia),
        cel(ESTADOS[causa.estado] ?? causa.estado),
        cel(causa.fechaIngreso),
        cel(causa.contraparte),
        cel(causa.abogadoResponsable),
        cel(plazosPorCausa[causa.id]),
        cel(causa.descripcion),
      ].join(';')
    ),
  ]

  const BOM = '﻿'
  const csv = BOM + lineas.join('\r\n')
  const fecha = new Date().toISOString().split('T')[0]

  await registrarAuditoria({
    userId,
    accion: 'EXPORT_CSV_CAUSAS',
    entidad: 'causa',
    detalle: `${rows.length} causas exportadas`,
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="causas_${fecha}.csv"`,
    },
  })
}
