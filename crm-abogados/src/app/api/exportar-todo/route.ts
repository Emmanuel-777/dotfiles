import { db, initDB } from '@/lib/db'
import {
  clientes, causas, actuaciones, asesorias, plazos, documentos,
  honorarios, cuotasHonorario, tareas, gestionesTarea, citas, prospectos, perfilAbogado,
} from '@/lib/schema'
import { eq, and, inArray, ne } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'
import { registrarAuditoria } from '@/lib/audit'
import { parseCredenciales, decrypt, looksEncrypted } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

function descifrarSiCorresponde(value: string | null): string | null {
  if (!value) return value
  return looksEncrypted(value) ? decrypt(value) : value
}

export async function GET() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return new Response('No autorizado', { status: 401 })

  // Las causas Penales quedan excluidas de exportaciones masivas (Ley 21.719,
  // Arts. 24-25 — prohibición de tratamiento masivo de datos de infracciones
  // penales). Una exportación de un solo cliente sí puede incluirlas; esta,
  // al cubrir todo el estudio de una vez, sigue el mismo criterio que ya
  // aplica la exportación CSV de causas.
  const [todosClientes, causasNoPenales, todosProspectos, perfil] = await Promise.all([
    db.select().from(clientes).where(eq(clientes.userId, userId)),
    db.select().from(causas).where(and(eq(causas.userId, userId), ne(causas.tipoCausa, 'Penal'))),
    db.select().from(prospectos).where(eq(prospectos.userId, userId)),
    db.select().from(perfilAbogado).where(eq(perfilAbogado.userId, userId)),
  ])

  const causaIds = causasNoPenales.map((c) => c.id)
  const clienteIds = todosClientes.map((c) => c.id)

  const [
    todasActuaciones, todasAsesorias, todosPlazos, todosDocumentos,
    todosHonorarios, todasCuotas, todasTareas, todasCitas,
  ] = await Promise.all([
    causaIds.length > 0
      ? db.select().from(actuaciones).where(and(eq(actuaciones.userId, userId), inArray(actuaciones.causaId, causaIds)))
      : Promise.resolve([]),
    clienteIds.length > 0
      ? db.select().from(asesorias).where(and(eq(asesorias.userId, userId), inArray(asesorias.clienteId, clienteIds)))
      : Promise.resolve([]),
    causaIds.length > 0
      ? db.select().from(plazos).where(and(eq(plazos.userId, userId), inArray(plazos.causaId, causaIds)))
      : Promise.resolve([]),
    causaIds.length > 0
      ? db.select().from(documentos).where(and(eq(documentos.userId, userId), inArray(documentos.causaId, causaIds)))
      : Promise.resolve([]),
    db.select().from(honorarios).where(eq(honorarios.userId, userId)),
    db.select().from(cuotasHonorario).where(eq(cuotasHonorario.userId, userId)),
    db.select().from(tareas).where(eq(tareas.userId, userId)),
    db.select().from(citas).where(eq(citas.userId, userId)),
  ])

  const asesoriasFiltradas = todasAsesorias.filter((a) => !a.causaId || causaIds.includes(a.causaId))
  const honorariosFiltrados = todosHonorarios.filter((h) => !h.causaId || causaIds.includes(h.causaId))
  const tareasFiltradas = todasTareas
    .filter((t) => !t.causaId || causaIds.includes(t.causaId))
    .map((t) => ({ ...t, credencialesPortal: parseCredenciales(t.credencialesPortal) }))
  const tareaIds = tareasFiltradas.map((t) => t.id)
  const citasFiltradas = todasCitas.filter((c) => !c.causaId || causaIds.includes(c.causaId))

  const todasGestiones = tareaIds.length > 0
    ? await db.select().from(gestionesTarea).where(and(eq(gestionesTarea.userId, userId), inArray(gestionesTarea.tareaId, tareaIds)))
    : []

  const perfilDescifrado = perfil[0]
    ? { ...perfil[0], numeroCuenta: descifrarSiCorresponde(perfil[0].numeroCuenta), titularRut: descifrarSiCorresponde(perfil[0].titularRut) }
    : null

  const data = {
    perfil: perfilDescifrado,
    clientes: todosClientes,
    prospectos: todosProspectos,
    causas: causasNoPenales,
    actuaciones: todasActuaciones,
    asesorias: asesoriasFiltradas,
    plazos: todosPlazos,
    documentos: todosDocumentos,
    honorarios: honorariosFiltrados,
    cuotasHonorario: todasCuotas.filter((c) => honorariosFiltrados.some((h) => h.id === c.honorarioId)),
    tareas: tareasFiltradas,
    gestionesTarea: todasGestiones,
    citas: citasFiltradas,
    nota: 'Las causas de tipo Penal y sus registros asociados (actuaciones, plazos, documentos, honorarios, tareas, citas) quedan excluidos de esta exportación masiva conforme a la Ley 21.719. Para exportar una causa Penal específica, hazlo desde la ficha de ese cliente.',
    exportadoEl: new Date().toISOString(),
  }

  await registrarAuditoria({
    userId,
    accion: 'EXPORT_TODO',
    entidad: 'cuenta',
    detalle: `${todosClientes.length} clientes, ${causasNoPenales.length} causas`,
  })

  const fecha = new Date().toISOString().split('T')[0]
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="lexcrm_respaldo_completo_${fecha}.json"`,
    },
  })
}
