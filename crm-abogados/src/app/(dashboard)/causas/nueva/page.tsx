'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X, FileText } from 'lucide-react'
import { TIPOS_CAUSA } from '@/lib/utils'
import TribunalSelect from '@/components/TribunalSelect'
import { toast } from 'sonner'

const TIPOS_DOC = ['PODER', 'ESCRITO', 'RESOLUCION', 'CONTRATO', 'OTRO']
const TIPO_DOC_LABELS: Record<string, string> = {
  PODER: 'Poder notarial / Patrocinio', ESCRITO: 'Escrito', RESOLUCION: 'Resolución',
  CONTRATO: 'Contrato', OTRO: 'Otro',
}
const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
const MAX_MB = 10

function NuevaCausaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string; rut: string }[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [docNombre, setDocNombre] = useState('')
  const [docTipo, setDocTipo] = useState('PODER')
  const [form, setForm] = useState({
    rol: '',
    tribunal: '',
    tipoCausa: 'Civil',
    materia: '',
    estado: 'EN_TRAMITE',
    fechaIngreso: new Date().toISOString().split('T')[0],
    contraparte: '',
    abogadoResponsable: '',
    descripcion: '',
    clienteId: searchParams.get('clienteId') || '',
    fechaPrescripcion: '',
  })

  useEffect(() => {
    fetch('/api/clientes').then((r) => r.json()).then(setClientes)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'tipoCausa' ? { tribunal: '' } : {}),
    }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera ${MAX_MB} MB`)
      e.target.value = ''
      return
    }
    setFile(f)
    const baseName = f.name.replace(/\.[^.]+$/, '')
    setDocNombre(baseName)
    const lower = f.name.toLowerCase()
    if (lower.includes('poder') || lower.includes('patrocinio')) setDocTipo('PODER')
    else if (lower.includes('contrato')) setDocTipo('CONTRATO')
    else if (lower.includes('resolucion') || lower.includes('resolución')) setDocTipo('RESOLUCION')
    else setDocTipo('PODER')
  }

  const removeFile = () => {
    setFile(null)
    setDocNombre('')
    setDocTipo('PODER')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Crear la causa
      const res = await fetch('/api/causas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fechaIngreso: new Date(form.fechaIngreso).toISOString() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const causa = await res.json()

      // 2. Si hay archivo, subirlo y registrar el documento
      if (file) {
        try {
          const fd = new FormData()
          fd.append('file', file)
          const uploadRes = await fetch('/api/documentos/upload', { method: 'POST', body: fd })
          if (!uploadRes.ok) throw new Error('Error al subir el archivo')
          const { url } = await uploadRes.json()
          await fetch('/api/documentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: docNombre || file.name, tipo: docTipo, causaId: causa.id, archivo: url }),
          })
        } catch {
          toast.warning('Causa creada, pero el archivo no se pudo subir. Puedes subirlo desde la causa.')
          router.push(`/causas/${causa.id}`)
          return
        }
      }

      toast.success(file ? 'Causa creada con documento adjunto' : 'Causa creada correctamente')
      router.push(`/causas/${causa.id}`)
    } catch {
      toast.error('Error al guardar la causa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href="/causas" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a causas
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva causa</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ROL / RIT *</label>
            <input name="rol" value={form.rol} onChange={handleChange} required className="input font-mono" placeholder="C-1234-2024" />
          </div>

          <div>
            <label className="label">Tipo de causa *</label>
            <select name="tipoCausa" value={form.tipoCausa} onChange={handleChange} className="input">
              {TIPOS_CAUSA.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Tribunal *</label>
            <TribunalSelect
              value={form.tribunal}
              onChange={(v) => setForm((prev) => ({ ...prev, tribunal: v }))}
              tipoCausa={form.tipoCausa}
            />
          </div>

          <div className="col-span-2">
            <label className="label">Cliente *</label>
            <select name="clienteId" value={form.clienteId} onChange={handleChange} required className="input">
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.rut})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Materia</label>
            <input name="materia" value={form.materia} onChange={handleChange} className="input" placeholder="Ej: Cobro de pesos" />
          </div>

          <div>
            <label className="label">Fecha de ingreso *</label>
            <input name="fechaIngreso" type="date" value={form.fechaIngreso} onChange={handleChange} required className="input" />
          </div>

          {form.tipoCausa === 'Penal' && (
            <div>
              <label className="label">Fecha de prescripción de la acción penal</label>
              <input name="fechaPrescripcion" type="date" value={form.fechaPrescripcion} onChange={handleChange} className="input" />
              <p className="text-xs text-gray-400 mt-1">Se usa para alertarte cuando se acerque, conforme a la Ley 21.719 (Arts. 24-25).</p>
            </div>
          )}

          <div>
            <label className="label">Carátula</label>
            <input name="contraparte" value={form.contraparte} onChange={handleChange} className="input" placeholder="Ej: Pérez con García" />
          </div>

          <div>
            <label className="label">Abogado responsable</label>
            <input name="abogadoResponsable" value={form.abogadoResponsable} onChange={handleChange} className="input" placeholder="Abg. Juan Pérez" />
          </div>

          <div>
            <label className="label">Estado inicial</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="EN_TRAMITE">En Trámite</option>
              <option value="SUSPENDIDA">Suspendida</option>
              <option value="TERMINADA">Terminada</option>
              <option value="ARCHIVADA">Archivada</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Descripción / Notas</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="input resize-none" placeholder="Resumen del caso, antecedentes relevantes..." />
          </div>

          {/* Documento adjunto */}
          <div className="col-span-2 pt-2 border-t border-gray-100">
            <label className="label">Documento adjunto (opcional)</label>
            {!file ? (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Subir patrocinio, poder u otro documento</p>
                  <p className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG — máx. {MAX_MB} MB</p>
                </div>
                <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFile} className="sr-only" />
              </label>
            ) : (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-blue-800 truncate flex-1">{file.name}</span>
                  <span className="text-xs text-blue-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" onClick={removeFile} className="text-blue-300 hover:text-blue-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Nombre del documento</label>
                    <input value={docNombre} onChange={(e) => setDocNombre(e.target.value)} className="input text-sm" placeholder="Patrocinio y poder..." />
                  </div>
                  <div>
                    <label className="label text-xs">Tipo</label>
                    <select value={docTipo} onChange={(e) => setDocTipo(e.target.value)} className="input text-sm">
                      {TIPOS_DOC.map((t) => <option key={t} value={t}>{TIPO_DOC_LABELS[t]}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? (file ? 'Guardando y subiendo...' : 'Guardando...') : 'Guardar causa'}
          </button>
          <Link href="/causas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevaCausaPage() {
  return (
    <Suspense>
      <NuevaCausaForm />
    </Suspense>
  )
}
