'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

const BIENVENIDA = '¡Hola! Soy el asistente de LexCRM. Puedo ayudarte con cualquier duda sobre el sistema. ¿En qué te ayudo?'

export default function AsistenteVirtual() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: 'assistant', content: BIENVENIDA },
  ])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes, abierto])

  useEffect(() => {
    if (abierto && inputRef.current) {
      inputRef.current.focus()
    }
  }, [abierto])

  async function enviar() {
    const texto = input.trim()
    if (!texto || cargando) return

    const nuevos: Mensaje[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevos)
    setInput('')
    setCargando(true)

    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: nuevos }),
      })
      const data = await res.json()
      const respuesta = data.respuesta || data.error || 'No pude obtener una respuesta. Intenta de nuevo.'
      setMensajes([...nuevos, { role: 'assistant', content: respuesta }])
    } catch {
      setMensajes([
        ...nuevos,
        { role: 'assistant', content: 'Error de conexión. Por favor intenta nuevamente.' },
      ])
    } finally {
      setCargando(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      {abierto && (
        <div
          className="flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden"
          style={{ width: '360px', height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-navy-800 to-navy-900 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white font-semibold text-sm">Asistente LexCRM</span>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0">
            {mensajes.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-3 py-2.5 shadow-sm">
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3 border-t border-slate-200 bg-white flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              disabled={cargando}
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 overflow-y-auto"
              style={{ maxHeight: '96px', lineHeight: '1.4' }}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || cargando}
              className="flex-shrink-0 h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Enviar mensaje"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          abierto
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        )}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente virtual'}
      >
        {abierto ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}
