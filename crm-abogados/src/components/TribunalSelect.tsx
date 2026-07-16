'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { TRIBUNALES_CHILE, tribunalesPorTipo } from '@/lib/utils'

/**
 * Selector de tribunal con dropdown propio (no usa <input list> nativo):
 * en Safari/iOS el <datalist> se muestra como una tira de sugerencias
 * apenas legible sobre el teclado, sin scroll ni forma de acotar por
 * región — inutilizable en celular con listas de 60+ tribunales.
 */
export default function TribunalSelect({
  value,
  onChange,
  tipoCausa,
}: {
  value: string
  onChange: (value: string) => void
  tipoCausa: string
}) {
  const [busqueda, setBusqueda] = useState(value)
  const [region, setRegion] = useState('')
  const [abierto, setAbierto] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => setBusqueda(value), [value])

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  const porTipo = useMemo(() => tribunalesPorTipo(tipoCausa, TRIBUNALES_CHILE), [tipoCausa])

  const regiones = useMemo(() => {
    const vistas = new Set<string>()
    const lista: string[] = []
    for (const t of porTipo) {
      if (!vistas.has(t.region)) { vistas.add(t.region); lista.push(t.region) }
    }
    return lista
  }, [porTipo])

  const filtrados = useMemo(() => {
    let lista = porTipo
    if (region) lista = lista.filter((t) => t.region === region)
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      lista = lista.filter((t) => t.nombre.toLowerCase().includes(q))
    }
    return lista.slice(0, 50)
  }, [porTipo, region, busqueda])

  const seleccionar = (nombre: string) => {
    onChange(nombre)
    setBusqueda(nombre)
    setAbierto(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      {regiones.length > 1 && (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="input mb-2 text-xs"
        >
          <option value="">Todas las regiones ({porTipo.length} tribunales)</option>
          {regiones.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}

      <div className="relative">
        <input
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); onChange(e.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          required
          className="input pr-8"
          placeholder={`Buscar tribunal${porTipo.length ? ` (${porTipo.length} disponibles)` : ''}...`}
          autoComplete="off"
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {abierto && filtrados.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtrados.map((t) => (
            <button
              key={t.nombre}
              type="button"
              onClick={() => seleccionar(t.nombre)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
            >
              {t.nombre}
              {!region && <span className="text-gray-400 text-xs"> · {t.region}</span>}
            </button>
          ))}
        </div>
      )}

      {abierto && busqueda.trim() && filtrados.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          Sin coincidencias — puedes escribir el nombre completo igual.
        </div>
      )}
    </div>
  )
}
