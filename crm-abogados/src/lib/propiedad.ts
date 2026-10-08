import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clientes, causas, prospectos } from '@/lib/schema'

/**
 * Comprueba que los identificadores externos que llegan en un body (cliente,
 * prospecto, causa) pertenezcan al usuario autenticado. Un id ajeno nunca debe
 * poder referenciarse: ni para enlazar datos entre cuentas ni para que el
 * sistema escriba o envíe correos con datos de otro estudio.
 * Devuelve el nombre del campo que NO pertenece, o null si todo es del usuario.
 */
export async function referenciaAjena(
  userId: string,
  ids: { clienteId?: string | null; prospectoId?: string | null; causaId?: string | null },
): Promise<'cliente' | 'prospecto' | 'causa' | null> {
  if (ids.clienteId) {
    const [r] = await db.select({ id: clientes.id }).from(clientes)
      .where(and(eq(clientes.id, ids.clienteId), eq(clientes.userId, userId)))
    if (!r) return 'cliente'
  }
  if (ids.prospectoId) {
    const [r] = await db.select({ id: prospectos.id }).from(prospectos)
      .where(and(eq(prospectos.id, ids.prospectoId), eq(prospectos.userId, userId)))
    if (!r) return 'prospecto'
  }
  if (ids.causaId) {
    const [r] = await db.select({ id: causas.id }).from(causas)
      .where(and(eq(causas.id, ids.causaId), eq(causas.userId, userId)))
    if (!r) return 'causa'
  }
  return null
}
