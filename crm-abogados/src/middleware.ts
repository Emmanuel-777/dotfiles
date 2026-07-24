import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { autorizadoPorLista, pruebasHabilitadas, accesoPorCuenta, type CuentaMeta } from '@/lib/acceso'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/notificaciones/cron',
  '/api/notificaciones/citas-cron',
  '/api/notificaciones/tareas-cron',
  '/api/notificaciones/citas-recordatorio-proximo',
  '/api/acceso/solicitud',
  '/no-autorizado',
])

// Rechazo de un usuario NO autorizado — comportamiento idéntico al de hoy:
// avisa al dueño (best-effort) y redirige a la landing o a /no-autorizado.
async function rechazarComoHoy(req: NextRequest, email: string) {
  // Igual que hoy: a las rutas /api/ se responde 403 JSON, sin disparar aviso.
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Aviso al dueño (best-effort, no bloquea la redirección)
  try {
    await fetch(new URL('/api/acceso/solicitud', req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ email }),
    })
  } catch (e) {
    console.error('Error notificando solicitud de acceso:', e)
  }

  const landingUrl = process.env.LANDING_URL
  if (landingUrl) {
    return NextResponse.redirect(`${landingUrl}/?motivo=no-autorizado&email=${encodeURIComponent(email)}`)
  }
  return NextResponse.redirect(new URL('/no-autorizado', req.url))
}

// Rutas alcanzables por un usuario autenticado que aún no tiene acceso pleno
// (está completando su alta de prueba o viendo la pantalla de suscripción).
function esRutaOnboarding(path: string): boolean {
  return path === '/bienvenida' || path === '/suscripcion' || path.startsWith('/api/trial')
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  // Exige sesión iniciada (igual que hoy)
  auth().protect()

  const { sessionClaims } = auth()
  const email = (sessionClaims?.email as string | undefined)?.toLowerCase() ?? ''

  // ── LISTA-PRIMERO ──────────────────────────────────────────────────────────
  // Los usuarios autorizados de hoy entran igual y NUNCA tocan el código nuevo.
  if (autorizadoPorLista(email)) return

  // ── A partir de aquí, SOLO llegan usuarios que HOY ya serían rechazados. ────
  const path = req.nextUrl.pathname

  // Interruptor apagado → exactamente el comportamiento de hoy.
  if (!pruebasHabilitadas()) {
    return rechazarComoHoy(req, email)
  }

  // Pruebas encendidas: estado de la cuenta desde el metadata de Clerk.
  const meta = (sessionClaims?.metadata ?? {}) as CuentaMeta

  // Cuenta activa (pagada) o prueba vigente → entra al CRM.
  if (accesoPorCuenta(meta)) return

  // Prueba vencida o cuenta bloqueada → pantalla de suscripción.
  if (meta.estado === 'trial' || meta.estado === 'bloqueado' || meta.estado === 'suspendido') {
    if (path === '/suscripcion' || path.startsWith('/api/trial')) return
    return NextResponse.redirect(new URL('/suscripcion', req.url))
  }

  // Sin cuenta todavía (prospecto recién registrado) → alta de prueba.
  if (esRutaOnboarding(path)) return
  return NextResponse.redirect(new URL('/bienvenida', req.url))
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
