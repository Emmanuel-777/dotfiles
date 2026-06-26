'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Pencil, Trash2, Phone, Mail, Building2, TrendingDown, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

type Etapa = 'CONTACTO' | 'REUNION' | 'PROPUESTA' | 'GANADO' | 'PERDIDO'

interface Prospecto {
  id: string
  nombre: string
  empresa: string | null
  email: string | null
  telefono: string | null
  origen: string | null
  etapa: string
  valorEstimado: number | null
  fechaContacto: string
  notas: string | null
}

const ETAPAS: { key: Etapa; label: string; headerClass: string; dotClass: string; textClass: string }[] = [
  { key: 'CONTACTO',  label: 'Contacto',  headerClass: 'bg-slate-50 border-slate-200',  dotClass: 'bg-slate-400',  textClass: 'text-slate-700' },
  { key: 'REUNION',   label: 'Reunión',   headerClass: 'bg-blue-50 border-blue-200',    dotClass: 'bg-blue-500',   textClass: 'text-blue-700' },
  { key: 'PROPUESTA', label: 'Propuesta', headerClass: 'bg-amber-50 border-amber-200',  dotClass: 'bg-amber-500',  textClass: 'text-amber-700' },
  { key: 'GANADO',    label: 'Ganado',    headerClass: 'bg-green-50 border-green-200',  dotClass: 'bg-green-500',  textClass: 'text-green-700' },
  { key: 'PERDIDO',   label: 'Perdido',   headerClass: 'bg-red-50 border-red-200',      dotClass: 'bg-red-400',    textClass: 'text-red-600' },
]

const ORDEN: Etapa[] = ['CONTACTO', 'REUNION', 'PROPUESTA', 'GANADO']

function formatValor(v: number | null | undefined) {
  if (!v) return null
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v)
}

export default function KanbanBoard({ prospectos: initial }: { prospectos: Prospecto[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [items, setItems] = useState(initial)

  useEffect(() => { setItems(initial) }, [initial])

  const moverEtapa = async (id: string, nuevaEtapa: Etapa) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, etapa: nuevaEtapa } : p))
    const res = await fetch(`/api/prospectos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa: nuevaEtapa }),
    })
    if (!res.ok) {
      setItems(initial)
      toast.error('No se pudo actualizar')
    } else {
      startTransition(() => router.refresh())
    }
  }

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/prospectos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.filter(p => p.id !== id))
      toast.success('Prospecto eliminado')
      startTransition(() => router.refresh())
    } else {
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 items-start min-h-[400px]">
      {ETAPAS.map(({ key, label, headerClass, dotClass, textClass }) => {
        const cards = items.filter(p => p.etapa === key)
        const totalValor = cards.reduce((sum, p) => sum + (p.valorEstimado ?? 0), 0)
        const idx = ORDEN.indexOf(key)

        return (
          <div key={key} className="flex-shrink-0 w-72 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${headerClass}`}>
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotClass}`} />
              <h3 className={`text-sm font-semibold flex-1 ${textClass}`}>{label}</h3>
              <span className="text-xs font-bold bg-white rounded-full px-2 py-0.5 border border-gray-200 text-gray-600">
                {cards.length}
              </span>
            </div>

            {totalValor > 0 && (
              <div className="px-4 py-2 bg-white border-b border-gray-100">
                <p className="text-[11px] text-gray-500">
                  Valor estimado: <span className="font-semibold text-gray-700">{formatValor(totalValor)}</span>
                </p>
              </div>
            )}

            <div className="p-3 space-y-2.5 min-h-[80px]">
              {cards.map(p => (
                <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nombre}</p>
                      {p.empresa && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{p.empresa}</span>
                        </p>
                      )}
                    </div>
                    {p.valorEstimado && (
                      <span className="flex-shrink-0 text-[11px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">
                        {formatValor(p.valorEstimado)}
                      </span>
                    )}
                  </div>

                  {(p.email || p.telefono) && (
                    <div className="space-y-0.5 mb-2">
                      {p.email && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{p.email}</span>
                        </p>
                      )}
                      {p.telefono && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0 text-gray-400" />
                          <span>{p.telefono}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-gray-100">
                    {/* Mover izquierda */}
                    {idx > 0 && (
                      <button
                        onClick={() => moverEtapa(p.id, ORDEN[idx - 1])}
                        title="Etapa anterior"
                        className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {/* Mover derecha */}
                    {idx >= 0 && idx < ORDEN.length - 1 && (
                      <button
                        onClick={() => moverEtapa(p.id, ORDEN[idx + 1])}
                        title="Siguiente etapa"
                        className="p-1 rounded text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {/* Marcar como perdido */}
                    {key !== 'PERDIDO' && key !== 'GANADO' && (
                      <button
                        onClick={() => moverEtapa(p.id, 'PERDIDO')}
                        title="Marcar como perdido"
                        className="p-1 rounded text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <TrendingDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {/* Reactivar desde perdido */}
                    {key === 'PERDIDO' && (
                      <button
                        onClick={() => moverEtapa(p.id, 'CONTACTO')}
                        title="Reactivar prospecto"
                        className="p-1 rounded text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <div className="flex-1" />

                    <Link
                      href={`/embudo/${p.id}/editar`}
                      title="Editar"
                      className="p-1 rounded text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => eliminar(p.id, p.nombre)}
                      title="Eliminar"
                      className="p-1 rounded text-gray-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cards.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-6">Sin prospectos</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
