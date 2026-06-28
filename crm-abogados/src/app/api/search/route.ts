import { NextResponse } from 'next/server'
import { db, initDB } from '@/lib/db'
import { clientes, causas, citas } from '@/lib/schema'
import { eq, and, or, like, desc } from 'drizzle-orm'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  await initDB()
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 2) {
    return NextResponse.json({ clientes: [], causas: [], citas: [] })
  }
  const term = `%${q}%`

  const [clientesRows, causasRows, citasRows] = await Promise.all([
    db.select({ id: clientes.id, nombre: clientes.nombre, rut: clientes.rut })
      .from(clientes)
      .where(and(eq(clientes.userId, userId), or(like(clientes.nombre, term), like(clientes.rut, term))))
      .limit(5),
    db.select({ id: causas.id, rol: causas.rol, tribunal: causas.tribunal, materia: causas.materia, cliente: clientes.nombre })
      .from(causas)
      .leftJoin(clientes, eq(causas.clienteId, clientes.id))
      .where(and(
        eq(causas.userId, userId),
        or(like(causas.rol, term), like(causas.materia, term), like(causas.contraparte, term)),
      ))
      .limit(5),
    db.select({ id: citas.id, titulo: citas.titulo, fecha: citas.fecha })
      .from(citas)
      .where(and(eq(citas.userId, userId), like(citas.titulo, term)))
      .orderBy(desc(citas.fecha))
      .limit(5),
  ])

  return NextResponse.json({ clientes: clientesRows, causas: causasRows, citas: citasRows })
}
