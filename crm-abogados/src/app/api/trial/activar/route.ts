import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { pruebasHabilitadas } from '@/lib/acceso'
import { normalizarRut, pruebaYaUsada, getCuenta, iniciarPrueba } from '@/lib/cuentas'
import { getResend, buildNuevaPruebaEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Validación básica de RUT chileno (formato + dígito verificador).
function rutValido(rut: string): boolean {
  const limpio = rut.replace(/[.\-\s]/g, '').toUpperCase()
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  let suma = 0
  let mul = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const resto = 11 - (suma % 11)
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return dv === dvEsperado
}

export async function POST(request: Request) {
  if (!pruebasHabilitadas()) {
    return NextResponse.json({ error: 'Las pruebas no están habilitadas' }, { status: 403 })
  }

  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const email = (sessionClaims?.email as string | undefined)?.toLowerCase() ?? ''
  if (!email) return NextResponse.json({ error: 'No se pudo leer el correo de la sesión' }, { status: 400 })

  const body = await request.json().catch(() => null)
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : ''
  const rut = typeof body?.rut === 'string' ? body.rut.trim() : ''
  const consentimiento = body?.consentimiento === true

  if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  if (!rutValido(rut)) return NextResponse.json({ error: 'El RUT no es válido' }, { status: 400 })
  if (!consentimiento) return NextResponse.json({ error: 'Debes aceptar el tratamiento de datos' }, { status: 400 })

  // Si ya tiene cuenta, no re-inicia (idempotente ante doble envío).
  const existente = await getCuenta(userId)
  if (existente) {
    return NextResponse.json({ ok: true, yaTenia: true })
  }

  // Salvaguarda: 1 prueba por RUT y por email.
  const rutNorm = normalizarRut(rut)
  if (await pruebaYaUsada(rutNorm, email)) {
    return NextResponse.json(
      { error: 'Ya existe una prueba asociada a este RUT o correo. Escríbenos si necesitas ayuda.' },
      { status: 409 },
    )
  }

  const { trialFin } = await iniciarPrueba({ userId, email, nombre, rutNorm })

  // Aviso al dueño — best-effort, no bloquea el ingreso del cliente.
  try {
    const resend = getResend()
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'LexCRM <onboarding@resend.dev>',
      to: 'contacto@lexcrm.site',
      subject: `✅ Nueva prueba: ${nombre}`,
      html: buildNuevaPruebaEmail({ nombre, email, rut, trialFin }),
    })
  } catch (e) {
    console.error('Error enviando aviso de nueva prueba:', e)
  }

  return NextResponse.json({ ok: true, trialFin })
}
