'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const TIPOS_DOC = ['ESCRITO', 'RESOLUCION', 'CONTRATO', 'PODER', 'OTRO']
const TIPO_LABELS: Record<string, string> = {
  ESCRITO: 'Escrito', RESOLUCION: 'Resolución', CONTRATO: 'Contrato', PODER: 'Poder notarial', OTRO: 'Otro',
}
const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
const MAX_MB = 10

interface Props {
  causaId: string
}

export default function CausaDocUpload({ causaId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('OTRO')
  const [loading, setLoading] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera ${MAX_MB} MB`)
      e.target.value = ''
      return
    }
    setFile(f)
    setNombre(f.name.replace(/\.[^.]+$/, ''))
    // Detectar tipo por nombre
    const lower = f.name.toLowerCase()
    if (lower.includes('poder') || lower.includes('patrocinio')) setTipo('PODER')
    else if (lower.includes('contrato')) setTipo('CONTRATO')
    else if (lower.includes('resolucion') || lower.includes('resolución')) setTipo('RESOLUCION')
    else setTipo('OTRO')
  }

  const reset = () => {
    setFile(null)
    setNombre('')
    setTipo('OTRO')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!file || !nombre.trim()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/documentos/upload', { method: 'POST', body: fd })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error al subir el archivo')
      }
      const { url } = await uploadRes.json()

      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), tipo, causaId, archivo: url }),
      })
      if (!res.ok) throw new Error('Error al guardar el documento')

      toast.success('Documento subido correctamente')
      reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <label className="flex items-center gap-2 px-5 py-3 cursor-pointer hover:bg-blue-50 transition-colors group border-t border-gray-100">
        <Upload className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
        <span className="text-xs text-gray-400 group-hover:text-blue-600">Subir archivo (PDF, DOC, JPG…)</span>
        <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFile} className="sr-only" />
      </label>
    )
  }

  return (
    <div className="px-5 py-3 border-t border-blue-100 bg-blue-50 space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="text-xs text-blue-700 truncate flex-1">{file.name}</span>
        <span className="text-[10px] text-blue-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        <button type="button" onClick={reset} className="text-blue-300 hover:text-blue-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del documento"
        className="input text-xs py-1.5"
      />
      <div className="flex items-center gap-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input text-xs py-1.5 flex-1">
          {TIPOS_DOC.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
        <button
          onClick={handleUpload}
          disabled={loading || !nombre.trim()}
          className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
