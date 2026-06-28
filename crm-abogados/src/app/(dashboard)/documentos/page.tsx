import { db, initDB } from '@/lib/db'
import { documentos, causas, clientes } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, FileText, File, ScrollText, FileSignature, FileBadge, Download } from 'lucide-react'
import { formatFechaCorta } from '@/lib/utils'
import { requireUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const tipoIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ESCRITO: ScrollText, RESOLUCION: FileBadge, CONTRATO: FileSignature, PODER: File, OTRO: FileText,
}
const tipoColors: Record<string, string> = {
  ESCRITO: 'text-blue-600 bg-blue-50', RESOLUCION: 'text-purple-600 bg-purple-50',
  CONTRATO: 'text-emerald-600 bg-emerald-50', PODER: 'text-orange-600 bg-orange-50',
  OTRO: 'text-gray-600 bg-gray-100',
}

export default async function DocumentosPage() {
  await initDB()
  const userId = await requireUserId()
  const rows = await db
    .select({ documento: documentos, causa: causas, cliente: clientes })
    .from(documentos)
    .leftJoin(causas, eq(documentos.causaId, causas.id))
    .leftJoin(clientes, eq(causas.clienteId, clientes.id))
    .where(eq(documentos.userId, userId))
    .orderBy(desc(documentos.createdAt))

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm mt-1">{rows.length} documentos registrados</p>
        </div>
        <Link href="/documentos/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Registrar documento
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(({ documento: doc, causa, cliente }) => {
          const Icon = tipoIcons[doc.tipo] || FileText
          const colorClass = tipoColors[doc.tipo] || tipoColors.OTRO
          return (
            <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cliente?.nombre}</p>
                  <p className="text-xs text-gray-400 font-mono">{causa?.rol}</p>
                  {doc.descripcion && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.descripcion}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`badge text-[10px] ${colorClass}`}>{doc.tipo}</span>
                    <span className="text-xs text-gray-400">{formatFechaCorta(doc.createdAt!)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <Link href={`/causas/${doc.causaId}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Ver causa →
                </Link>
                {doc.archivo && (
                  <a
                    href={doc.archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {rows.length === 0 && (
        <div className="card py-20 text-center text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No hay documentos registrados</p>
        </div>
      )}
    </div>
  )
}
