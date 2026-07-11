import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { perfilAbogado } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'
import { encrypt, decrypt, looksEncrypted } from '@/lib/crypto'

const CAMPOS_REQUERIDOS = ['email', 'whatsapp', 'banco', 'tipoCuenta', 'numeroCuenta', 'titularNombre', 'titularRut'] as const

function calcularPerfilCompleto(data: Record<string, unknown>): boolean {
  return CAMPOS_REQUERIDOS.every((campo) => typeof data[campo] === 'string' && data[campo].trim().length > 0)
}

function descifrarSiCorresponde(value: string | null): string | null {
  if (!value) return value
  return looksEncrypted(value) ? decrypt(value) : value
}

export async function GET() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [perfil] = await db.select().from(perfilAbogado).where(eq(perfilAbogado.userId, userId))
  if (!perfil) return NextResponse.json(null)
  return NextResponse.json({
    ...perfil,
    numeroCuenta: descifrarSiCorresponde(perfil.numeroCuenta),
    titularRut: descifrarSiCorresponde(perfil.titularRut),
  })
}

export async function PUT(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const datos = {
    email: body.email ?? null,
    whatsapp: body.whatsapp ?? null,
    banco: body.banco ?? null,
    tipoCuenta: body.tipoCuenta ?? null,
    numeroCuenta: body.numeroCuenta ?? null,
    titularNombre: body.titularNombre ?? null,
    titularRut: body.titularRut ?? null,
  }
  const perfilCompleto = calcularPerfilCompleto(datos) ? 1 : 0

  const datosCifrados = {
    ...datos,
    numeroCuenta: datos.numeroCuenta ? encrypt(datos.numeroCuenta) : null,
    titularRut: datos.titularRut ? encrypt(datos.titularRut) : null,
  }

  const [existente] = await db.select({ userId: perfilAbogado.userId }).from(perfilAbogado).where(eq(perfilAbogado.userId, userId))

  if (existente) {
    await db.update(perfilAbogado)
      .set({ ...datosCifrados, perfilCompleto, updatedAt: new Date().toISOString() })
      .where(eq(perfilAbogado.userId, userId))
  } else {
    await db.insert(perfilAbogado).values({ userId, ...datosCifrados, perfilCompleto })
  }

  const [row] = await db.select().from(perfilAbogado).where(eq(perfilAbogado.userId, userId))
  return NextResponse.json({
    ...row,
    numeroCuenta: descifrarSiCorresponde(row.numeroCuenta),
    titularRut: descifrarSiCorresponde(row.titularRut),
  })
}
