// Lógica central de acceso. Principio inviolable: el sistema de pruebas solo
// puede AGREGAR accesos, nunca quitarle acceso a quien hoy entra. Por eso la
// lista (ALLOWED_EMAILS) manda primero y los usuarios actuales nunca pasan por
// el código nuevo.

export const TRIAL_DIAS = 7

/** Estado de la cuenta guardado en el metadata de Clerk. */
export interface CuentaMeta {
  estado?: 'trial' | 'activo' | 'bloqueado' | 'suspendido'
  plan?: 'pro' | 'basico'
  trialFin?: string
}

/** ¿Las pruebas están habilitadas? Interruptor de emergencia. Apagado = comportamiento de hoy. */
export function pruebasHabilitadas(): boolean {
  return process.env.TRIALS_ENABLED === 'true'
}

/**
 * Replica EXACTAMENTE el criterio de acceso de hoy:
 * - Sin ALLOWED_EMAILS definida → todos los autenticados entran.
 * - Con la lista → entra solo quien esté en ella.
 */
export function autorizadoPorLista(email: string | undefined | null): boolean {
  const rawList = process.env.ALLOWED_EMAILS
  if (!rawList) return true
  const allowed = rawList.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  if (allowed.length === 0) return true
  return !!email && allowed.includes(email.toLowerCase())
}

/** ¿La prueba sigue vigente según el metadata? */
export function trialVigente(meta: CuentaMeta | undefined): boolean {
  return (
    meta?.estado === 'trial' &&
    !!meta.trialFin &&
    Date.now() < Date.parse(meta.trialFin)
  )
}

/** ¿La cuenta puede entrar al CRM según su estado de prueba/pago? */
export function accesoPorCuenta(meta: CuentaMeta | undefined): boolean {
  return meta?.estado === 'activo' || trialVigente(meta)
}
