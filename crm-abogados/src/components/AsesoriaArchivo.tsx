'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'

const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
const MAX_MB = 10

interface Props {
  existente?: { url: string; nombre: string } | null
  onChange: (archivo: { url: string; nombre: string } | null) => void
}

export default function AsesoriaArchivo({ existente, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [pendiente, setPendiente] = useState<{ url: string; nombre: string } | null>(null)
  const [quitado, setQuitado] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera ${MAX_MB} MB`)
      e.target.value = ''
      return
    }
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch('/api/documentos/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error al subir el archivo')
      }
      const { url } = await res.json()
      const archivo = { url, nombre: f.name }
      setPendiente(archivo)
      setQuitado(false)
      onChange(archivo)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const quitar = () => {
    setPendiente(null)
    setQuitado(true)
    onChange(null)
  }

  const activo = pendiente ?? (!quitado ? existente : null)

  return (
    <div>
      <label className="label">Documento adjunto <span className="text-gray-400 font-normal">(opcional)</span></label>
      {activo ? (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-blue-700 truncate flex-1">{activo.nombre}</span>
          {!pendiente && existente && (
            <a
              href={`/api/asesorias/download?url=${encodeURIComponent(existente.url)}`}
              className="text-blue-500 hover:text-blue-700"
              title="Descargar"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button type="button" onClick={quitar} className="text-blue-300 hover:text-blue-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
          {subiendo ? <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-gray-400" />}
          <span className="text-xs text-gray-500">
            {subiendo ? 'Subiendo...' : `Subir archivo (PDF, DOC, JPG… máx. ${MAX_MB} MB)`}
          </span>
          <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFile} disabled={subiendo} className="sr-only" />
        </label>
      )}
    </div>
  )
}
