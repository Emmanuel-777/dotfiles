import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { clientes } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET() {
  await initDB()
  const rows = await db.select().from(clientes).orderBy(asc(clientes.nombre))
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()
  const { rut, nombre, tipo, email, telefono, celular, direccion, ciudad, region, notas } = body

  if (!rut || !nombre) {
    return NextResponse.json({ error: 'RUT y nombre son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(clientes).values({ id, rut, nombre, tipo: tipo || 'PERSONA_NATURAL', email, telefono, celular, direccion, ciudad, region, notas, createdAt: now, updatedAt: now })
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id))
  return NextResponse.json(cliente, { status: 201 })
}
