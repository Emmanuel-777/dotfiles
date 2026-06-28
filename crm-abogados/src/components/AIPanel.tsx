'use client'

import { useState } from 'react'
import { Sparkles, FileText, Loader2, Copy, Check, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'

type Modo = 'resumen' | 'borrador'

export default function AIPanel({ causaId, tiposEscrito }: { causaId: string; tiposEscrito: string[] }) {
  const [modo, setModo] = useState<Modo>('resumen')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState('')
  const [copiado, setCopiado] = useState(false)

  // Estado del borrador
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

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <div className="rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 p-1.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">Asistente IA</h2>
        <span className="ml-auto rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
          Beta
        </span>
      </div>

      {/* Selector de modo */}
      <div className="grid grid-cols-2 gap-1 p-3">
        <button
          onClick={() => { setModo('resumen'); setResultado('') }}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            modo === 'resumen' ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Resumen de causa
        </button>
        <button
          onClick={() => { setModo('borrador'); setResultado('') }}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            modo === 'borrador' ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Borrador de escrito
        </button>
      </div>

      <div className="px-5 pb-5">
        {modo === 'resumen' ? (
          <p className="mb-3 text-xs text-gray-500">
            Genera un resumen ejecutivo del estado de la causa a partir de sus actuaciones, plazos y tareas.
          </p>
        ) : (
          <div className="mb-3 space-y-3">
            <div>
              <label className="label text-xs">Tipo de escrito</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
                {tiposEscrito.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Instrucciones (opcional)</label>
              <textarea
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
                rows={2}
                className="input resize-none"
                placeholder="Ej: solicitar prórroga de 5 días por motivos de salud…"
              />
            </div>
          </div>
        )}

        <button onClick={generar} disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generando…' : modo === 'resumen' ? 'Generar resumen' : 'Generar borrador'}
        </button>

        {resultado && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Resultado</span>
              <button onClick={copiar} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                {copiado ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{resultado}</p>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Contenido generado por IA. Revísalo y ajústalo antes de usarlo o presentarlo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
