'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, Printer, Scale } from 'lucide-react'

const TIPOS_GESTION = [
  'Demanda',
  'Contestación de demanda',
  'Recurso de apelación',
  'Recurso de reposición',
  'Escrito de allanamiento',
  'Solicita medida precautoria',
  'Escrito de réplica',
  'Escrito de dúplica',
  'Incidente',
  'Solicita absolución de posiciones',
  'Solicita diligencia',
  'Solicita copias',
  'Carta certificada',
  'Otro',
]

interface Causa {
  id: string
  rol: string
  tribunal: string
  tipoCausa: string
  materia: string | null
  abogadoResponsable: string | null
  estado: string
}

interface Cliente {
  id: string
  nombre: string
  rut: string
}

export default function CaratulaPage() {
  const params = useParams()
  const clienteId = params.id as string
  const { user } = useUser()
  const nombreAbogadoSesion = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Abogado/a'

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [causas, setCausas] = useState<Causa[]>([])
  const [causaSeleccionada, setCausaSeleccionada] = useState<string>('')
  const [tipoGestion, setTipoGestion] = useState('Demanda')
  const [tipoPersonalizado, setTipoPersonalizado] = useState('')
  const [fechaGestion, setFechaGestion] = useState(new Date().toISOString().split('T')[0])
  const [abogado, setAbogado] = useState('')

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}`)
      .then((r) => r.json())
      .then((data) => setCliente(data))

    fetch(`/api/causas?clienteId=${clienteId}`)
      .then((r) => r.json())
      .then((data: { causa: Causa }[]) => {
        const lista = data.map((d) => d.causa ?? d)
        setCausas(lista)
        if (lista.length > 0) {
          setCausaSeleccionada(lista[0].id)
          if (lista[0].abogadoResponsable) setAbogado(lista[0].abogadoResponsable)
        }
      })
  }, [clienteId])

  // Al cambiar causa, actualizar abogado
  const causa = causas.find((c) => c.id === causaSeleccionada) ?? null
  useEffect(() => {
    if (causa?.abogadoResponsable) setAbogado(causa.abogadoResponsable)
  }, [causaSeleccionada])

  const gestionFinal = tipoGestion === 'Otro' ? tipoPersonalizado : tipoGestion

  const fechaFormateada = (() => {
    if (!fechaGestion) return ''
    const [y, m, d] = fechaGestion.split('-').map(Number)
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    return `${d} de ${meses[m - 1]} de ${y}`
  })()

  if (!cliente) return <div className="p-4 lg:p-8 text-gray-400">Cargando...</div>

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 2.5cm; size: A4 portrait; }
          .no-print { display: none !important; }
          .print-field {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            font-size: inherit !important;
            color: inherit !important;
            -webkit-appearance: none;
          }
          select.print-field { background-image: none !important; }
          .caratula-box { box-shadow: none !important; border: 2px solid black !important; }
        }
      `}</style>

      {/* Panel de control — no se imprime */}
      <div className="no-print p-6 bg-gray-50 border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/clientes/${clienteId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700">Carátula</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Causa */}
            <div>
              <label className="label">Causa (ROL)</label>
              <select
                value={causaSeleccionada}
                onChange={(e) => setCausaSeleccionada(e.target.value)}
                className="input"
              >
                {causas.map((c) => (
                  <option key={c.id} value={c.id}>{c.rol}</option>
                ))}
              </select>
            </div>

            {/* Abogado */}
            <div>
              <label className="label">Abogado</label>
              <input
                value={abogado}
                onChange={(e) => setAbogado(e.target.value)}
                className="input"
                placeholder="Nombre del abogado"
              />
            </div>

            {/* Tipo de gestión */}
            <div>
              <label className="label">Tipo de gestión</label>
              <select
                value={tipoGestion}
                onChange={(e) => setTipoGestion(e.target.value)}
                className="input"
              >
                {TIPOS_GESTION.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Tipo personalizado */}
            {tipoGestion === 'Otro' && (
              <div>
                <label className="label">Especificar gestión</label>
                <input
                  value={tipoPersonalizado}
                  onChange={(e) => setTipoPersonalizado(e.target.value)}
                  className="input"
                  placeholder="Ej: Solicita diligencia probatoria"
                />
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="label">Fecha de la gestión</label>
              <input
                type="date"
                value={fechaGestion}
                onChange={(e) => setFechaGestion(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="btn-primary mt-4"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* CARÁTULA — esto es lo que se imprime */}
      <div className="max-w-2xl mx-auto my-10 px-6 print:my-0 print:px-0">
        <div className="caratula-box border-2 border-gray-800 rounded-none bg-white" style={{ minHeight: '600px' }}>

          {/* Encabezado */}
          <div className="border-b-2 border-gray-800 px-8 py-5 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-700 p-2 rounded">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm tracking-wide">{nombreAbogadoSesion}</p>
                <p className="text-xs text-gray-500">LexCRM · Gestión Legal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Carátula</p>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-10 py-8 space-y-0">

            {/* Abogado */}
            <Row label="ABOGADO PATROCINANTE" value={abogado || '—'} large />

            <Divider />

            {/* Cliente */}
            <Row label="CLIENTE" value={cliente.nombre} />
            <Row label="RUT" value={cliente.rut} mono />

            <Divider />

            {/* Causa */}
            <Row label="ROL / RIT" value={causa?.rol ?? '—'} mono large />
            <Row label="TRIBUNAL" value={causa?.tribunal ?? '—'} />
            <Row label="TIPO DE CAUSA" value={[causa?.tipoCausa, causa?.materia].filter(Boolean).join(' · ') || '—'} />

            <Divider />

            {/* Gestión */}
            <Row label="TIPO DE GESTIÓN" value={gestionFinal || '—'} large accent />
            <Row label="FECHA DE LA GESTIÓN" value={fechaFormateada || '—'} />

          </div>

          {/* Pie */}
          <div className="border-t-2 border-gray-800 px-10 py-5 mt-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="border-t border-gray-400 pt-1 mt-12 w-48">
                  <p className="text-xs text-gray-500 text-center">Firma Abogado</p>
                  <p className="text-xs text-gray-700 text-center font-medium">{abogado || '_______________'}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Generado con LexCRM</p>
                <p>{new Date().toLocaleDateString('es-CL')}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

function Row({ label, value, mono = false, large = false, accent = false }: {
  label: string; value: string; mono?: boolean; large?: boolean; accent?: boolean
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-0.5">{label}</p>
      <p className={[
        mono ? 'font-mono' : 'font-sans',
        large ? 'text-lg font-bold' : 'text-sm font-medium',
        accent ? 'text-blue-800' : 'text-gray-900',
      ].join(' ')}>
        {value}
      </p>
    </div>
  )
}

function Divider() {
  return <div className="border-t-2 border-gray-200 my-1" />
}
