import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/notificaciones/cron',
  '/api/notificaciones/citas-cron',
  '/api/notificaciones/tareas-cron',
  '/api/acceso/solicitud',
  '/no-autorizado',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  // Redirect to sign-in if not authenticated
  auth().protect()

  // Email allowlist — activate by setting ALLOWED_EMAILS in Vercel env vars
  // Requires email in Clerk JWT: Dashboard → Sessions → Customize session token
  // Add: { "email": "{{user.primary_email_address}}" }
  const rawList = process.env.ALLOWED_EMAILS
  if (rawList) {
    const allowed = rawList.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    if (allowed.length > 0) {
      const { sessionClaims } = auth()
      const email = (sessionClaims?.email as string | undefined)?.toLowerCase()
      if (email && !allowed.includes(email)) {
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ error: 'No autorizado' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // Aviso al dueño de que este correo intentó acceder — best-effort, no bloquea la redirección
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

        // Con LANDING_URL definida (dominio separado: landing en la raíz,
        // CRM en subdominio), el visitante no autorizado va a la landing con
        // su banner de "cuenta pendiente de activación". Sin la variable,
        // fallback a la página interna — evita loops mientras landing y CRM
        // compartan dominio.
        const landingUrl = process.env.LANDING_URL
        if (landingUrl) {
          return NextResponse.redirect(`${landingUrl}/?motivo=no-autorizado&email=${encodeURIComponent(email)}`)
        }
        return NextResponse.redirect(new URL('/no-autorizado', req.url))
      }
    }
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
