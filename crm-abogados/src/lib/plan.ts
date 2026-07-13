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

/** Para server components y API routes. */
export async function getPlan(): Promise<Plan> {
  const { sessionClaims } = await auth()
  const email = sessionClaims?.email as string | undefined
  return planForEmail(email)
}
