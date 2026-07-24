import { auth } from '@clerk/nextjs/server'

export type Plan = 'basico' | 'pro'

/**
 * Gate manual de plan Pro — mismo patrón que ALLOWED_EMAILS: sin pasarela de
 * pago para Chile, el operador agrega el correo del cliente Pro a mano.
 * Sin PLAN_PRO_EMAILS definida, todos quedan en Básico.
 */
function proEmails(): string[] {
  return (process.env.PLAN_PRO_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function planForEmail(email: string | undefined | null): Plan {
  if (!email) return 'basico'
  return proEmails().includes(email.toLowerCase()) ? 'pro' : 'basico'
}

/** ¿La sesión actual es una cuenta de prueba? (para topar la IA, etc.) */
export async function esCuentaTrial(): Promise<boolean> {
  const { sessionClaims } = await auth()
  const meta = (sessionClaims?.metadata ?? {}) as { estado?: string }
  return meta.estado === 'trial'
}

/** Para server components y API routes. */
export async function getPlan(): Promise<Plan> {
  const { sessionClaims } = await auth()
  const email = sessionClaims?.email as string | undefined

  // PLAN_PRO_EMAILS manda: los clientes Pro de hoy quedan Pro pase lo que pase.
  if (planForEmail(email) === 'pro') return 'pro'

  // Prueba vigente o cuenta activa con plan Pro (sistema de pruebas) → Pro.
  const meta = (sessionClaims?.metadata ?? {}) as { estado?: string; plan?: string; trialFin?: string }
  if (meta.plan === 'pro') {
    if (meta.estado === 'activo') return 'pro'
    if (meta.estado === 'trial' && meta.trialFin && Date.now() < Date.parse(meta.trialFin)) return 'pro'
  }

  return 'basico'
}
