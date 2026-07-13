'use client'

import { useState } from 'react'
import { Sparkles, FileText, Loader2, Copy, Check, ClipboardList, Scale, Lock } from 'lucide-react'
import { toast } from 'sonner'

type Modo = 'resumen' | 'borrador'

interface AIPanelProps {
  causaId: string
  tiposEscrito: string[]
  causaRol?: string
  causaTribunal?: string
  plan: 'basico' | 'pro'
}

export default function AIPanel({ causaId, tiposEscrito, causaRol, causaTribunal, plan }: AIPanelProps) {
  const [modo, setModo] = useState<Modo>('resumen')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState('')
  const [copiado, setCopiado] = useState(false)

  const [tipo, setTipo] = useState(tiposEscrito[0] ?? '')
  const [instrucciones, setInstrucciones] = useState('')

  const generar = async () => {
    setLoading(true)
    setResultado('')
    setCopiado(false)
    try {
      const endpoint = modo === 'resumen' ? '/api/ai/resumen' : '/api/ai/borrador'
      const body = modo === 'resumen' ? { causaId } : { causaId, tipo, instrucciones }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al generar')
      setResultado(data.texto)
      toast.success(modo === 'resumen' ? 'Resumen generado' : 'Borrador generado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al generar con IA')
    } finally {
      setLoading(false)
    }
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(resultado)
      setCopiado(true)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  if (plan !== 'pro') {
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 bg-gradient-to-r from-violet-50 to-blue-50">
          <div className="rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 p-1.5">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Asistente IA</h2>
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Plan Pro
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
          <div className="rounded-full bg-gray-100 p-3">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">
            Genera resúmenes ejecutivos y borradores de escritos con IA. Esta función es parte del plan Pro.
          </p>
          <a
            href="https://wa.me/56979710838?text=Hola%2C%20quiero%20actualizar%20mi%20plan%20LexCRM%20a%20Pro%20para%20usar%20el%20Asistente%20IA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Actualizar a Pro
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 bg-gradient-to-r from-violet-50 to-blue-50">
        <div className="rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 p-1.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">Asistente IA</h2>
        <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
          Beta
        </span>
      </div>

      {/* Causa context header */}
      {(causaRol || causaTribunal) && (
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-5 py-2.5">
          <Scale className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            {causaRol && (
              <span className="text-[11px] font-semibold font-mono text-blue-700">{causaRol}</span>
            )}
            {causaRol && causaTribunal && (
              <span className="text-[11px] text-blue-400 mx-1">·</span>
            )}
            {causaTribunal && (
              <span className="text-[11px] text-blue-600 truncate">{causaTribunal}</span>
            )}
          </div>
        </div>
      )}

      {/* Selector de modo */}
      <div className="grid grid-cols-2 gap-1 p-3 bg-gray-50 border-b border-gray-100">
        <button
          onClick={() => { setModo('resumen'); setResultado('') }}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            modo === 'resumen'
              ? 'bg-white text-violet-700 shadow-sm border border-violet-200'
              : 'text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Resumen
        </button>
        <button
          onClick={() => { setModo('borrador'); setResultado('') }}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            modo === 'borrador'
              ? 'bg-white text-violet-700 shadow-sm border border-violet-200'
              : 'text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Borrador
        </button>
      </div>

      <div className="px-5 pt-4 pb-5">
        {modo === 'resumen' ? (
          <p className="mb-4 text-xs text-gray-500 leading-relaxed">
            Genera un resumen ejecutivo del estado de la causa a partir de sus actuaciones, plazos y tareas.
          </p>
        ) : (
          <div className="mb-4 space-y-3">
            <div>
              <label className="label text-xs">Tipo de escrito</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input text-sm">
                {tiposEscrito.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Instrucciones <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
                rows={3}
                className="input resize-none text-sm"
                placeholder="Ej: solicitar prórroga de 5 días por motivos de salud…"
              />
            </div>
          </div>
        )}

        <button
          onClick={generar}
          disabled={loading}
          className="btn-primary w-full justify-center gap-2 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Generando…</>
            : <><Sparkles className="h-4 w-4" />{modo === 'resumen' ? 'Generar resumen' : 'Generar borrador'}</>
          }
        </button>

        {resultado && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Resultado</span>
              <button
                onClick={copiar}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {copiado ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{resultado}</p>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Contenido generado por IA. Revísalo antes de usarlo o presentarlo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
