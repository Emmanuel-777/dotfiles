import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { perfilAbogado } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

const CAMPOS_REQUERIDOS = ['email', 'whatsapp', 'banco', 'tipoCuenta', 'numeroCuenta', 'titularNombre', 'titularRut'] as const

function calcularPerfilCompleto(data: Record<string, unknown>): boolean {
  return CAMPOS_REQUERIDOS.every((campo) => typeof data[campo] === 'string' && data[campo].trim().length > 0)
}

export async function GET() {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [perfil] = await db.select().from(perfilAbogado).where(eq(perfilAbogado.userId, userId))
  return NextResponse.json(perfil ?? null)
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

  const [existente] = await db.select({ userId: perfilAbogado.userId }).from(perfilAbogado).where(eq(perfilAbogado.userId, userId))

  if (existente) {
    await db.update(perfilAbogado)
      .set({ ...datos, perfilCompleto, updatedAt: new Date().toISOString() })
      .where(eq(perfilAbogado.userId, userId))
  } else {
    await db.insert(perfilAbogado).values({ userId, ...datos, perfilCompleto })
  }

  const [row] = await db.select().from(perfilAbogado).where(eq(perfilAbogado.userId, userId))
  return NextResponse.json(row)
}
