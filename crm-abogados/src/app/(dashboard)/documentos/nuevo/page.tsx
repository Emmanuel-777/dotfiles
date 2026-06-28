'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X, FileText } from 'lucide-react'
import { toast } from 'sonner'

const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
const MAX_MB = 10

function NuevoDocumentoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [causas, setCausas] = useState<{ id: string; rol: string; cliente: { nombre: string } }[]>([])
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'ESCRITO',
    descripcion: '',
    causaId: searchParams.get('causaId') || '',
  })

  useEffect(() => {
    fetch('/api/causas').then((r) => r.json()).then(setCausas)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera el límite de ${MAX_MB} MB`)
      e.target.value = ''
      return
    }
    setFile(f)
    if (!form.nombre) {
      setForm((prev) => ({ ...prev, nombre: f.name.replace(/\.[^.]+$/, '') }))
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let archivoUrl: string | null = null

      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const uploadRes = await fetch('/api/documentos/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          throw new Error(err.error ?? 'Error al subir el archivo')
        }
        const { url } = await uploadRes.json()
        archivoUrl = url
      }

      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, archivo: archivoUrl }),
      })
      if (!res.ok) throw new Error()
      toast.success('Documento registrado')
      router.push('/documentos')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-lg">
      <Link href="/documentos" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar documento</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">

        {/* File upload */}
        <div>
          <label className="label">Archivo (opcional)</label>
          {file ? (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-800 truncate flex-1">{file.name}</span>
              <span className="text-xs text-blue-500 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button type="button" onClick={removeFile} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-500">Haz clic para subir un archivo</span>
              <span className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG — máx. {MAX_MB} MB</span>
              <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFile} className="sr-only" />
            </label>
          )}
        </div>

        <div>
          <label className="label">Nombre del documento *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="Demanda cobro de pesos" />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
            <option value="ESCRITO">Escrito</option>
            <option value="RESOLUCION">Resolución</option>
            <option value="CONTRATO">Contrato</option>
            <option value="PODER">Poder notarial</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div>
          <label className="label">Causa *</label>
          <select name="causaId" value={form.causaId} onChange={handleChange} required className="input">
            <option value="">Seleccionar causa...</option>
            {causas.map((c) => (
              <option key={c.id} value={c.id}>{c.rol} – {c.cliente?.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="input resize-none" placeholder="Breve descripción del documento..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? (file ? 'Subiendo...' : 'Guardando...') : 'Registrar'}
          </button>
          <Link href="/documentos" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevoDocumentoPage() {
  return <Suspense><NuevoDocumentoForm /></Suspense>
}
