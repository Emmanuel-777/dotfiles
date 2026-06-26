import { db, initDB } from '@/lib/db'
import { causas, clientes, actuaciones, plazos, tareas } from '@/lib/schema'
import { eq, and, desc, asc } from 'drizzle-orm'
import { buildCausaContext } from './prompts'

/**
 * Carga una causa (validando pertenencia al usuario) y arma el contexto
 * textual para la IA. Devuelve null si la causa no existe o no es del usuario.
 */
export async function loadCausaContext(causaId: string, userId: string): Promise<string | null> {
  await initDB()
  const [row] = await db
    .select({ causa: causas, cliente: clientes })
    .from(causas)
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(and(eq(causas.id, causaId), eq(causas.userId, userId)))

  if (!row) return null

  const [acts, pls, tks] = await Promise.all([
    db.select().from(actuaciones).where(and(eq(actuaciones.causaId, causaId), eq(actuaciones.userId, userId))).orderBy(desc(actuaciones.fecha)),
    db.select().from(plazos).where(and(eq(plazos.causaId, causaId), eq(plazos.userId, userId))).orderBy(asc(plazos.fecha)),
    db.select().from(tareas).where(and(eq(tareas.causaId, causaId), eq(tareas.userId, userId))).orderBy(asc(tareas.fechaVencimiento)),
  ])

  return buildCausaContext({ causa: row.causa, cliente: row.cliente, actuaciones: acts, plazos: pls, tareas: tks })
}
