'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Briefcase, CalendarDays, Loader2, CornerDownLeft, X } from 'lucide-react'

interface SearchResults {
  clientes: { id: string; nombre: string; rut: string }[]
  causas: { id: string; rol: string; tribunal: string | null; materia: string | null; cliente: string | null }[]
  citas: { id: string; titulo: string; fecha: string }[]
}

interface FlatItem {
  href: string
  label: string
  sub: string
  group: 'Clientes' | 'Causas' | 'Citas'
  icon: typeof Users
}

const EMPTY: SearchResults = { clientes: [], causas: [], citas: [] }

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Atajo de teclado Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Foco al abrir, reset al cerrar
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      setQuery('')
      setResults(EMPTY)
      setActive(0)
    }
  }, [open])

  // Búsqueda con debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        if (res.ok) {
          setResults(await res.json())
          setActive(0)
        }
      } catch {
        /* abort */
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  const flat: FlatItem[] = [
    ...results.clientes.map((c) => ({
      href: `/clientes/${c.id}`, label: c.nombre, sub: c.rut, group: 'Clientes' as const, icon: Users,
    })),
    ...results.causas.map((c) => ({
      href: `/causas/${c.id}`, label: `ROL ${c.rol}`, sub: [c.cliente, c.materia].filter(Boolean).join(' · '), group: 'Causas' as const, icon: Briefcase,
    })),
    ...results.citas.map((c) => ({
      href: `/citas/${c.id}`, label: c.titulo, sub: c.fecha, group: 'Citas' as const, icon: CalendarDays,
    })),
  ]

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault()
      go(flat[active].href)
    }
  }

  // Trigger visible en el header (botón)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors w-full max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar clientes, causas, citas…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
          ⌘K
        </kbd>
      </button>
    )
  }

  let renderedGroup = ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-300" /> : <Search className="h-5 w-5 text-gray-300" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar clientes, causas, citas…"
            className="w-full py-4 text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Cerrar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto py-2">
          {query.trim().length < 2 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Escribe al menos 2 caracteres para buscar</p>
          ) : flat.length === 0 && !loading ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados para “{query}”</p>
          ) : (
            flat.map((item, i) => {
              const Icon = item.icon
              const showHeader = item.group !== renderedGroup
              renderedGroup = item.group
              return (
                <div key={item.href}>
                  {showHeader && (
                    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{item.group}</p>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item.href)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === active ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`rounded-lg p-1.5 ${i === active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.label}</p>
                      {item.sub && <p className="truncate text-xs text-gray-400">{item.sub}</p>}
                    </div>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-blue-400" />}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
