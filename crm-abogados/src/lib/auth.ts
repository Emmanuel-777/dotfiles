import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

/**
 * Para server components / páginas.
 * Devuelve el userId del abogado logueado o redirige a /sign-in.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return userId
}

/**
 * Para API routes.
 * Devuelve el userId o null (la ruta responde 401).
 */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
