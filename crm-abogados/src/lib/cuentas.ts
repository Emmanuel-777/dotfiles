import { clerkClient } from '@clerk/nextjs/server'
import { eq, or, desc } from 'drizzle-orm'
import { db, initDB } from '@/lib/db'
import { cuentas } from '@/lib/schema'
import { TRIAL_DIAS, type CuentaMeta } from '@/lib/acceso'

/** Normaliza un RUT para comparar (sin puntos, guión ni espacios, en minúscula). */
export function normalizarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toLowerCase()
}

/**
 * ¿Ya se usó una prueba con este RUT o este email? (salvaguarda: 1 por persona).
 * La tabla `cuentas` persiste aunque el usuario borre su cuenta de Clerk, así
 * que el mismo RUT/email no puede volver a iniciar otra prueba.
 */
export async function pruebaYaUsada(rutNorm: string, email: string): Promise<boolean> {
  await initDB()
  const filas = await db
    .select({ userId: cuentas.userId, rut: cuentas.rut, email: cuentas.email })
    .from(cuentas)
    .where(or(eq(cuentas.rut, rutNorm), eq(cuentas.email, email.toLowerCase())))
  return filas.length > 0
}

export async function getCuenta(userId: string) {
  await initDB()
  const [c] = await db.select().from(cuentas).where(eq(cuentas.userId, userId))
  return c ?? null
}

/**
 * Escribe el estado de la cuenta en el metadata público de Clerk para que el
 * middleware lo lea desde la sesión (sin consultar la base en cada request).
 */
export async function sincronizarMetadataClerk(userId: string, meta: CuentaMeta): Promise<void> {
  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, { publicMetadata: { ...meta } })
}

/** Lista todas las cuentas (para el panel de admin), más recientes primero. */
export async function listarCuentas() {
  await initDB()
  return db.select().from(cuentas).orderBy(desc(cuentas.createdAt))
}

/** Activa una cuenta como cliente permanente pagado (plan Pro). */
export async function activarPagado(userId: string) {
  await initDB()
  await db.update(cuentas)
    .set({ estado: 'activo', plan: 'pro', updatedAt: new Date().toISOString() })
    .where(eq(cuentas.userId, userId))
  await sincronizarMetadataClerk(userId, { estado: 'activo', plan: 'pro' })
}

/** Suspende una cuenta (pierde acceso → pantalla de suscripción). */
export async function suspenderCuenta(userId: string) {
  await initDB()
  await db.update(cuentas)
    .set({ estado: 'suspendido', updatedAt: new Date().toISOString() })
    .where(eq(cuentas.userId, userId))
  await sincronizarMetadataClerk(userId, { estado: 'suspendido', plan: 'basico' })
}

/** Reinicia la prueba (otros 7 días de Pro). */
export async function reactivarPrueba(userId: string) {
  await initDB()
  const ahora = new Date()
  const trialFin = new Date(ahora.getTime() + TRIAL_DIAS * 24 * 60 * 60 * 1000).toISOString()
  await db.update(cuentas)
    .set({ estado: 'trial', plan: 'pro', trialInicio: ahora.toISOString(), trialFin, updatedAt: ahora.toISOString() })
    .where(eq(cuentas.userId, userId))
  await sincronizarMetadataClerk(userId, { estado: 'trial', plan: 'pro', trialFin })
}

/** Elimina la cuenta de prueba (libera el RUT/email) y limpia el metadata de Clerk. */
export async function eliminarCuenta(userId: string) {
  await initDB()
  await db.delete(cuentas).where(eq(cuentas.userId, userId))
  await sincronizarMetadataClerk(userId, {})
}

/** Crea la cuenta de prueba (7 días, plan Pro) y sincroniza el metadata de Clerk. */
export async function iniciarPrueba(params: {
  userId: string
  email: string
  nombre: string
  rutNorm: string
}) {
  await initDB()
  const ahora = new Date()
  const fin = new Date(ahora.getTime() + TRIAL_DIAS * 24 * 60 * 60 * 1000)
  const trialInicio = ahora.toISOString()
  const trialFin = fin.toISOString()

  await db.insert(cuentas).values({
    userId: params.userId,
    email: params.email.toLowerCase(),
    nombre: params.nombre,
    rut: params.rutNorm,
    plan: 'pro',
    estado: 'trial',
    trialInicio,
    trialFin,
    createdAt: trialInicio,
    updatedAt: trialInicio,
  })

  await sincronizarMetadataClerk(params.userId, { estado: 'trial', plan: 'pro', trialFin })

  return { trialInicio, trialFin }
}
