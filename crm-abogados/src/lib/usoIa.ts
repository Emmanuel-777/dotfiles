import { eq } from 'drizzle-orm'
import { db, initDB } from '@/lib/db'
import { usoIa } from '@/lib/schema'
import { hoyChile } from '@/lib/utils'

// Tope diario de usos de IA para cuentas en prueba. Las cuentas pagadas no
// tienen tope. Configurable con TRIAL_IA_LIMITE (por defecto 25).
export function limiteDiarioIA(): number {
  const n = parseInt(process.env.TRIAL_IA_LIMITE || '', 10)
  return Number.isFinite(n) && n > 0 ? n : 25
}

/**
 * Registra un uso de IA del día y dice si estaba permitido. Para cuentas que no
 * son de prueba (esTrial=false) siempre permite y no cuenta.
 */
export async function chequearYRegistrarIA(userId: string, esTrial: boolean): Promise<{ permitido: boolean; limite: number }> {
  const limite = limiteDiarioIA()
  if (!esTrial) return { permitido: true, limite }

  await initDB()
  const fecha = hoyChile()
  const id = `${userId}:${fecha}`

  const [fila] = await db.select().from(usoIa).where(eq(usoIa.id, id))
  const conteo = fila?.conteo ?? 0

  if (conteo >= limite) return { permitido: false, limite }

  if (fila) {
    await db.update(usoIa).set({ conteo: conteo + 1 }).where(eq(usoIa.id, id))
  } else {
    await db.insert(usoIa).values({ id, userId, fecha, conteo: 1 })
  }
  return { permitido: true, limite }
}
