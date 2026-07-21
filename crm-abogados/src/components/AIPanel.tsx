'use client'

import { useState, type ReactNode } from 'react'
import { Sparkles, FileText, Loader2, Copy, Check, ClipboardList, Scale, Lock, MessageCircle, Mail, AlertTriangle, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatPhoneWhatsApp } from '@/lib/utils'

type Modo = 'resumen' | 'borrador'

/** Convierte **negrita** dentro de una línea a <strong>, sin librerías externas. */
function renderInline(texto: string): ReactNode {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)
  return partes.map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**')
      ? <strong key={i} className="text-gray-900">{parte.slice(2, -2)}</strong>
      : parte
  )
}

/** Renderizador liviano del subconjunto de Markdown que devuelve la IA: encabezados #/##/###, negrita, listas con - o números. */
function renderMarkdown(texto: string): ReactNode[] {
  const lineas = texto.split('\n')
  const bloques: ReactNode[] = []
  let listaItems: string[] = []
  let listaOrdenada = false

  const flushLista = () => {
    if (listaItems.length === 0) return
    const items = listaItems
    if (listaOrdenada) {
      bloques.push(
        <ol key={bloques.length} className="list-decimal pl-5 space-y-1 mb-2">
          {items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}
        </ol>
      )
    } else {
      bloques.push(
        <ul key={bloques.length} className="list-disc pl-5 space-y-1 mb-2">
          {items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}
        </ul>
      )
    }
    listaItems = []
  }

  for (const linea of lineas) {
    const trimmed = linea.trim()
    if (!trimmed) { flushLista(); continue }

    const headerMatch = trimmed.match(/^(#{1,3})\s+(.*)/)
    if (headerMatch) {
      flushLista()
      const nivel = headerMatch[1].length
      const clase = nivel === 1
        ? 'text-[13px] font-bold text-gray-900 mt-3 mb-1 first:mt-0'
        : nivel === 2
        ? 'text-[12.5px] font-bold text-gray-900 mt-3 mb-1 first:mt-0'
        : 'text-[12px] font-semibold text-gray-800 mt-2 mb-1 first:mt-0'
      bloques.push(<p key={bloques.length} className={clase}>{renderInline(headerMatch[2])}</p>)
      continue
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/)
    if (bulletMatch) {
      if (listaOrdenada) flushLista()
      listaOrdenada = false
      listaItems.push(bulletMatch[1])
      continue
    }

    const numMatch = trimmed.match(/^\d+[.)]\s+(.*)/)
    if (numMatch) {
      if (!listaOrdenada) flushLista()
      listaOrdenada = true
      listaItems.push(numMatch[1])
      continue
    }

    flushLista()
    bloques.push(<p key={bloques.length} className="mb-2 last:mb-0">{renderInline(trimmed)}</p>)
  }
  flushLista()
  return bloques
}

/**
 * Convierte el Markdown que devuelve la IA a texto limpio, listo para copiar o
 * enviar (sin **, ##, >, ni tablas con |). Así lo que sale de LexCRM se ve como
 * un texto normal, no como "formato de chat".
 */
function markdownToPlainText(md: string): string {
  const out: string[] = []
  for (const linea of md.split('\n')) {
    let t = linea
    // Fila separadora de tabla: |---|---|  → se descarta
    if (/^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*$/.test(t)) continue
    // Fila de tabla: | a | b |  → "a — b"
    if (/^\s*\|.*\|\s*$/.test(t)) {
      const celdas = t.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()).filter(Boolean)
      t = celdas.join(' — ')
    }
    t = t.replace(/^\s{0,3}#{1,6}\s+/, '')       // encabezados
    t = t.replace(/^\s{0,3}>\s?/, '')             // citas
    t = t.replace(/^(\s*)[-*]\s+/, '$1• ')        // viñetas
    t = t.replace(/\*\*([^*]+)\*\*/g, '$1')       // negrita
    t = t.replace(/__([^_]+)__/g, '$1')           // negrita alterna
    t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // enlaces → texto
    t = t.replace(/`([^`]+)`/g, '$1')             // código en línea
    out.push(t)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

interface AIPanelProps {
  causaId: string
  tiposEscrito: string[]
  causaRol?: string
  causaTribunal?: string
  plan: 'basico' | 'pro'
  clienteNombre?: string
  clienteCelular?: string | null
  clienteEmail?: string | null
}

export default function AIPanel({ causaId, tiposEscrito, causaRol, causaTribunal, plan, clienteNombre, clienteCelular, clienteEmail }: AIPanelProps) {
  const [modo, setModo] = useState<Modo>('resumen')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [editando, setEditando] = useState(false)
  const [borradorEdit, setBorradorEdit] = useState('')
  // Versión editada por el usuario (texto limpio). Si es null, se usa el resultado de la IA.
  const [textoFinal, setTextoFinal] = useState<string | null>(null)

  const [tipo, setTipo] = useState(tiposEscrito[0] ?? '')
  const [instrucciones, setInstrucciones] = useState('')

  const generar = async () => {
    setLoading(true)
    setResultado('')
    setCopiado(false)
    setEditando(false)
    setTextoFinal(null)
    try {
      const endpoint = modo === 'resumen' ? '/api/ai/resumen' : '/api/ai/borrador'
      const body = modo === 'resumen' ? { causaId } : { causaId, tipo, instrucciones }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al generar')
      }
      if (!res.body) {
        // Fallback sin streaming (por si un proxy no lo soporta)
        setResultado(await res.text())
      } else {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acumulado = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          acumulado += decoder.decode(value, { stream: true })
          setResultado(acumulado)
        }
        acumulado += decoder.decode()
        setResultado(acumulado)
      }
      toast.success(modo === 'resumen' ? 'Resumen generado' : 'Borrador generado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al generar con IA')
    } finally {
      setLoading(false)
    }
  }

  // Texto limpio para copiar/enviar: la versión editada por el usuario, o el
  // resultado de la IA convertido a texto plano (sin símbolos de Markdown).
  const salida = textoFinal ?? markdownToPlainText(resultado)

  const iniciarEdicion = () => {
    setBorradorEdit(salida)
    setEditando(true)
  }
  const guardarEdicion = () => {
    setTextoFinal(borradorEdit)
    setEditando(false)
    toast.success('Resumen actualizado')
  }
  const cancelarEdicion = () => setEditando(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(salida)
      setCopiado(true)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const asuntoEnvio = modo === 'resumen'
    ? `Resumen de la causa${causaRol ? ` ${causaRol}` : ''}`
    : `Borrador — ${tipo}${causaRol ? ` (causa ${causaRol})` : ''}`

  const mensajeEnvio = clienteNombre
    ? `Estimado/a ${clienteNombre},\n\n${salida}`
    : salida

  const waUrl = resultado && clienteCelular
    ? `https://wa.me/${formatPhoneWhatsApp(clienteCelular)}?text=${encodeURIComponent(mensajeEnvio)}`
    : null
  const mailUrl = resultado && clienteEmail
    ? `mailto:${clienteEmail}?subject=${encodeURIComponent(asuntoEnvio)}&body=${encodeURIComponent(mensajeEnvio)}`
    : null

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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {editando ? 'Editar resultado' : 'Resultado'}
              </span>
              {!editando && !loading && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={iniciarEdicion}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={copiar}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {copiado ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
            {modo === 'borrador' && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-800">
                  <strong>Borrador de apoyo generado por IA.</strong> Revísalo íntegramente, verifica
                  las citas legales, los datos de las partes y los plazos, y complétalo antes de
                  presentarlo ante el tribunal. La responsabilidad del escrito es siempre del abogado.
                </p>
              </div>
            )}
            {editando ? (
              <div>
                <textarea
                  value={borradorEdit}
                  onChange={(e) => setBorradorEdit(e.target.value)}
                  rows={14}
                  autoFocus
                  className="input w-full resize-y text-sm leading-relaxed"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={guardarEdicion}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    <Check className="h-3.5 w-3.5" />Guardar cambios
                  </button>
                  <button
                    onClick={cancelarEdicion}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" />Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                {textoFinal !== null
                  ? <p className="whitespace-pre-wrap">{textoFinal}</p>
                  : renderMarkdown(resultado)}
              </div>
            )}
            {modo === 'resumen' && !editando && (
              <p className="mt-2 text-[11px] text-gray-400">
                Contenido generado por IA. Revísalo o edítalo antes de usarlo o presentarlo.
              </p>
            )}

            {!loading && !editando && (waUrl || mailUrl) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-400">Enviar al cliente:</span>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded-full transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </a>
                )}
                {mailUrl && (
                  <a
                    href={mailUrl}
                    className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-full transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
