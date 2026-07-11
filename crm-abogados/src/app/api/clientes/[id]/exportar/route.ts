import { db, initDB } from '@/lib/db'
import { clientes, causas, actuaciones, plazos, documentos, honorarios, tareas, citas } from '@/lib/schema'
import { eq, and, inArray, or } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'
import { registrarAuditoria } from '@/lib/audit'
import { parseCredenciales } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return new Response('No autorizado', { status: 401 })

  const [cliente] = await db.select().from(clientes).where(and(eq(clientes.id, params.id), eq(clientes.userId, userId)))
  if (!cliente) return new Response('No encontrado', { status: 404 })

  const clienteCausas = await db.select().from(causas).where(and(eq(causas.clienteId, params.id), eq(causas.userId, userId)))
  const causaIds = clienteCausas.map((c) => c.id)

  const [todasActuaciones, todosPlazos, todosDocumentos, todosHonorarios, todasTareas, todasCitas] = await Promise.all([
    causaIds.length > 0
      ? db.select().from(actuaciones).where(and(eq(actuaciones.userId, userId), inArray(actuaciones.causaId, causaIds)))
      : Promise.resolve([]),
    causaIds.length > 0
      ? db.select().from(plazos).where(and(eq(plazos.userId, userId), inArray(plazos.causaId, causaIds)))
      : Promise.resolve([]),
    causaIds.length > 0
      ? db.select().from(documentos).where(and(eq(documentos.userId, userId), inArray(documentos.causaId, causaIds)))
      : Promise.resolve([]),
    db.select().from(honorarios).where(and(
      eq(honorarios.userId, userId),
      causaIds.length > 0
        ? or(eq(honorarios.clienteId, params.id), inArray(honorarios.causaId, causaIds))
        : eq(honorarios.clienteId, params.id),
    )),
    db.select().from(tareas).where(and(
      eq(tareas.userId, userId),
      causaIds.length > 0
        ? or(eq(tareas.clienteId, params.id), inArray(tareas.causaId, causaIds))
        : eq(tareas.clienteId, params.id),
    )),
    db.select().from(citas).where(and(eq(citas.userId, userId), eq(citas.clienteId, params.id))),
  ])

  const tareasDescifradas = todasTareas.map((t) => ({
    ...t,
    credencialesPortal: parseCredenciales(t.credencialesPortal),
  }))

  const data = {
    cliente,
    causas: clienteCausas,
    actuaciones: todasActuaciones,
    plazos: todosPlazos,
    documentos: todosDocumentos,
    honorarios: todosHonorarios,
    tareas: tareasDescifradas,
    citas: todasCitas,
    exportadoEl: new Date().toISOString(),
  }

  await registrarAuditoria({
    userId,
    accion: 'EXPORT_CLIENTE_DATOS',
    entidad: 'cliente',
    entidadId: params.id,
    detalle: `${cliente.nombre} (${cliente.rut})`,
  })

  const fecha = new Date().toISOString().split('T')[0]
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="cliente_${cliente.rut}_datos_${fecha}.json"`,
    },
  })
}
