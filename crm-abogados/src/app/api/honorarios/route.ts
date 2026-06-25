import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { honorarios, clientes, causas } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from '@/lib/nanoid'

export async function GET() {
  await initDB()
  const rows = await db
    .select({ honorario: honorarios, cliente: clientes, causa: causas })
    .from(honorarios)
    .leftJoin(clientes, eq(honorarios.clienteId, clientes.id))
    .leftJoin(causas, eq(honorarios.causaId, causas.id))
    .orderBy(desc(honorarios.createdAt))
  return NextResponse.json(rows.map((r) => ({ ...r.honorario, cliente: r.cliente, causa: r.causa })))
}

export async function POST(req: Request) {
  await initDB()
  const body = await req.json()
  const { descripcion, monto, tipo, estado, fechaEmision, fechaVence, notas, clienteId, causaId } = body

  if (!descripcion || !monto || !clienteId) {
    return NextResponse.json({ error: 'Descripción, monto y cliente son requeridos' }, { status: 400 })
  }

  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(honorarios).values({
    id,
    descripcion,
    monto: parseFloat(monto),
    tipo: tipo || 'HONORARIO',
    estado: estado || 'PENDIENTE',
    fechaEmision: fechaEmision || now,
    fechaVence: fechaVence || null,
    notas,
    clienteId,
    causaId: causaId || null,
    createdAt: now,
    updatedAt: now,
  })
  const [hon] = await db.select().from(honorarios).where(eq(honorarios.id, id))
  return NextResponse.json(hon, { status: 201 })
}
