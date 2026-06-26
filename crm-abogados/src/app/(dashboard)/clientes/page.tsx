import { db, initDB } from '@/lib/db'
import { clientes, causas } from '@/lib/schema'
import { eq, asc, count } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, User, Building2, Phone, Mail, Briefcase } from 'lucide-react'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  await initDB()
  const userId = await requireUserId()
  const rows = await db.select().from(clientes).where(eq(clientes.userId, userId)).orderBy(asc(clientes.nombre))

  const causasCounts = await db
    .select({ clienteId: causas.clienteId, total: count() })
    .from(causas)
    .where(eq(causas.userId, userId))
    .groupBy(causas.clienteId)

  const countMap = Object.fromEntries(causasCounts.map((c) => [c.clienteId, c.total]))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} clientes registrados</p>
        </div>
        <Link href="/clientes/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Cliente</th>
              <th className="table-header">RUT</th>
              <th className="table-header">Contacto</th>
              <th className="table-header">Ciudad</th>
              <th className="table-header text-center">Causas</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${cliente.tipo === 'PERSONA_JURIDICA' ? 'bg-violet-100' : 'bg-blue-100'}`}>
                      {cliente.tipo === 'PERSONA_JURIDICA'
                        ? <Building2 className="h-4 w-4 text-violet-600" />
                        : <User className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cliente.nombre}</p>
                      <p className="text-xs text-gray-400">{cliente.tipo === 'PERSONA_JURIDICA' ? 'Persona Jurídica' : 'Persona Natural'}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell font-mono text-gray-600">{cliente.rut}</td>
                <td className="table-cell">
                  <div className="space-y-0.5">
                    {cliente.email && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Mail className="h-3 w-3" />{cliente.email}</div>
                    )}
                    {cliente.celular && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs"><Phone className="h-3 w-3" />{cliente.celular}</div>
                    )}
                  </div>
                </td>
                <td className="table-cell text-gray-600">{cliente.ciudad || '—'}</td>
                <td className="table-cell text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    {countMap[cliente.id] ?? 0}
                  </span>
                </td>
                <td className="table-cell">
                  <Link href={`/clientes/${cliente.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Ver carpeta
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">No hay clientes registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
