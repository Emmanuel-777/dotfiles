import { timingSafeEqual } from 'crypto'

const MIN_LARGO = 16

/**
 * Autoriza llamadas internas (cron de Vercel y aviso desde el middleware).
 *
 * Antes se comparaba con `Bearer ${process.env.CRON_SECRET}`: si la variable
 * no existía, el valor esperado era "Bearer undefined" y cualquiera podía
 * entrar mandando exactamente eso. Ahora, sin secreto configurado (o demasiado
 * corto) NADIE entra, y la comparación es de tiempo constante.
 */
export function cronAutorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET
  if (!secreto || secreto.length < MIN_LARGO) return false

  const recibido = request.headers.get('authorization') ?? ''
  const esperado = `Bearer ${secreto}`
  const a = Buffer.from(recibido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}
