import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/no-autorizado',
])

export default clerkMiddleware((auth, req) => {
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
        return NextResponse.redirect(new URL('/no-autorizado', req.url))
      }
    }
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
