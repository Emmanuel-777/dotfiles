'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  PLANTILLAS, TEXTO_CLAUSULAS, TEXTO_GASTOS, TEXTO_PAGO, TEXTO_POR_QUE, type EtapaInput,
} from '@/lib/presupuestos/plantillas'
import {
  MAX_CUOTAS, VIGENCIA_AUDIENCIA_CERCANA, VIGENCIA_NORMAL,
  calcEtapa, formatoMonto, totalComprometido, vigenciaHasta, type Moneda,
} from '@/lib/presupuestos/calculo'

type ClienteOpt = { id: string; nombre: string; rut?: string | null }

interface Form {
  clienteId: string
  causaId: string
  clienteNombre: string
  clienteRut: string
  pagador: string
  materia: string
  fecha: string
  vigenciaDias: number
  impuestos: 'neutro' | 'bruto' | 'neto'
  moneda: Moneda
  valorUf: string
  antecedentes: string
  objetivo: string
  porQue: string
  gastos: string
  condicionesPago: string
  clausulas: string
  exitoActivo: boolean
  exitoAbono: number
  exitoPct: number
  estado: string
  etapas: EtapaInput[]
}

const hoy = () => new Date().toISOString().slice(0, 10)

function desdePlantilla(nombre: string): Partial<Form> {
  const t = PLANTILLAS[nombre]
  return {
    materia: t.materia,
    etapas: t.etapas.map((e) => ({ ...e })),
    exitoActivo: !!t.exito?.activo,
    exitoAbono: t.exito?.abono ?? 0,
    exitoPct: t.exito?.pct ?? 0,
  }
}

const base = (): Form => ({
  clienteId: '', causaId: '', clienteNombre: '', clienteRut: '', pagador: '', materia: '',
  fecha: hoy(), vigenciaDias: VIGENCIA_NORMAL, impuestos: 'neutro', moneda: 'CLP', valorUf: '',
  antecedentes: '', objetivo: '', porQue: TEXTO_POR_QUE, gastos: TEXTO_GASTOS,
  condicionesPago: TEXTO_PAGO, clausulas: TEXTO_CLAUSULAS,
  exitoActivo: false, exitoAbono: 0, exitoPct: 0, estado: 'BORRADOR', etapas: [],
  ...desdePlantilla('Litigio por etapas'),
})

export default function PresupuestoEditor({ inicial }: { inicial?: Record<string, any> }) {
  const router = useRouter()
  const esNuevo = !inicial
  const [guardando, setGuardando] = useState(false)
  const [plantilla, setPlantilla] = useState(esNuevo ? 'Litigio por etapas' : '')
  const [clientes, setClientes] = useState<ClienteOpt[]>([])
  const [form, setForm] = useState<Form>(() => {
    if (!inicial) return base()
    return {
      ...base(),
      ...inicial,
      clienteId: inicial.clienteId ?? '',
      causaId: inicial.causaId ?? '',
      clienteRut: inicial.clienteRut ?? '',
      pagador: inicial.pagador ?? '',
      valorUf: inicial.valorUf ? String(inicial.valorUf) : '',
      etapas: (inicial.etapas ?? []).map((e: any) => ({
        nombre: e.nombre, descripcion: e.descripcion ?? '', honorarios: e.honorarios, abono: e.abono,
        cuotas: e.cuotas, opcional: !!e.opcional, activada: !!e.activada, nota: e.nota ?? '',
      })),
    } as Form
  })

  useEffect(() => {
    fetch('/api/clientes').then((r) => (r.ok ? r.json() : [])).then((c) => Array.isArray(c) && setClientes(c)).catch(() => {})
  }, [])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setEtapa = (i: number, parche: Partial<EtapaInput>) =>
    setForm((f) => ({ ...f, etapas: f.etapas.map((e, j) => (j === i ? { ...e, ...parche } : e)) }))

  const aplicarPlantilla = (nombre: string) => {
    setPlantilla(nombre)
    setForm((f) => ({ ...f, ...desdePlantilla(nombre), vigenciaDias: VIGENCIA_NORMAL }))
  }

  const elegirCliente = (id: string) => {
    const c = clientes.find((x) => x.id === id)
    setForm((f) => ({ ...f, clienteId: id, ...(c ? { clienteNombre: c.nombre, clienteRut: c.rut ?? f.clienteRut } : {}) }))
  }

  const total = useMemo(() => totalComprometido(form.etapas), [form.etapas])
  const hasta = useMemo(() => vigenciaHasta(form.fecha, form.vigenciaDias), [form.fecha, form.vigenciaDias])

  const guardar = async () => {
    if (form.moneda === 'UF' && !(parseFloat(form.valorUf) > 0)) {
      return toast.error('Indica el valor de la UF para convertir los montos al aceptar')
    }
    setGuardando(true)
    try {
      const res = await fetch(esNuevo ? '/api/presupuestos' : `/api/presupuestos/${inicial!.id}`, {
        method: esNuevo ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valorUf: form.moneda === 'UF' ? parseFloat(form.valorUf) : null }),
      })
      if (!res.ok) throw new Error()
      const guardado = await res.json()
      toast.success(esNuevo ? `Presupuesto ${guardado.folio} creado` : 'Presupuesto guardado')
      if (esNuevo) router.push(`/presupuestos/${guardado.id}`)
      else router.refresh()
    } catch {
      toast.error('No se pudo guardar el presupuesto')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!inicial || !confirm('¿Eliminar este presupuesto? No se puede deshacer.')) return
    const res = await fetch(`/api/presupuestos/${inicial.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Presupuesto eliminado'); router.push('/presupuestos') }
    else toast.error('No se pudo eliminar')
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <Link href="/presupuestos" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {esNuevo ? 'Nuevo presupuesto' : `Presupuesto ${inicial!.folio}`}
        </h1>
        {!esNuevo && (
          <span className="badge bg-gray-100 text-gray-700">Vigente hasta {hasta.split('-').reverse().join('/')}</span>
        )}
      </div>

      <div className="card p-6 space-y-6">
        {esNuevo && (
          <section>
            <p className="label">Materia (plantilla)</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PLANTILLAS).map((n) => (
                <button
                  key={n} type="button" onClick={() => aplicarPlantilla(n)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${plantilla === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-400'}`}
                >{n}</button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Cada plantilla carga una estructura con montos de ejemplo. Reemplázalos por tus propios valores.</p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Cliente</h2>
          <div>
            <label className="label">Cliente del CRM (opcional)</label>
            <select className="input" value={form.clienteId} onChange={(e) => elegirCliente(e.target.value)}>
              <option value="">Escribir manualmente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Nombre *</label>
              <input className="input" value={form.clienteNombre} onChange={(e) => set('clienteNombre', e.target.value)} /></div>
            <div><label className="label">RUT</label>
              <input className="input" value={form.clienteRut} onChange={(e) => set('clienteRut', e.target.value)} /></div>
          </div>
          <div><label className="label">Quien paga, si es un tercero (aseguradora, familiar)</label>
            <input className="input" value={form.pagador} onChange={(e) => set('pagador', e.target.value)} placeholder="Nombre, RUT y datos completos" /></div>
          <div><label className="label">Materia</label>
            <input className="input" value={form.materia} onChange={(e) => set('materia', e.target.value)} /></div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Antecedentes y objetivo</h2>
          <div><label className="label">Antecedentes del caso (solo hechos informados)</label>
            <textarea className="input" rows={4} value={form.antecedentes} onChange={(e) => set('antecedentes', e.target.value)} /></div>
          <div><label className="label">Objetivo de la representación (sin prometer resultados)</label>
            <textarea className="input" rows={4} value={form.objetivo} onChange={(e) => set('objetivo', e.target.value)} /></div>
          <p className="text-xs text-gray-400">Estos dos textos se guardan cifrados y no se incluyen en la exportación masiva.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Etapas y honorarios</h2>
          {form.etapas.map((e, i) => {
            const c = calcEtapa(e, form.moneda)
            return (
              <div key={i} className="border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input className="input" placeholder="Etapa o servicio" value={e.nombre} onChange={(ev) => setEtapa(i, { nombre: ev.target.value })} />
                  <button type="button" aria-label="Quitar etapa" className="text-gray-300 hover:text-red-500"
                    onClick={() => set('etapas', form.etapas.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
                </div>
                <textarea className="input" rows={2} placeholder="Qué comprende" value={e.descripcion} onChange={(ev) => setEtapa(i, { descripcion: ev.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="label">Honorarios</label>
                    <input className="input" type="number" min={0} value={e.honorarios} onChange={(ev) => setEtapa(i, { honorarios: parseFloat(ev.target.value) || 0 })} /></div>
                  <div><label className="label">Abono</label>
                    <input className="input" type="number" min={0} value={e.abono} onChange={(ev) => setEtapa(i, { abono: parseFloat(ev.target.value) || 0 })} /></div>
                  <div><label className="label">Cuotas</label>
                    <input className="input" type="number" min={0} max={MAX_CUOTAS} value={e.cuotas} onChange={(ev) => setEtapa(i, { cuotas: Math.min(MAX_CUOTAS, parseInt(ev.target.value, 10) || 0) })} /></div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={e.opcional} onChange={(ev) => setEtapa(i, { opcional: ev.target.checked })} />
                    Solo si corresponde (bloque independiente)
                  </label>
                  <p className="text-xs text-gray-500 font-mono">
                    Saldo {formatoMonto(c.saldo, form.moneda)}{c.cuotas > 0 && c.saldo > 0 ? ` · ${c.cuotas} × ${formatoMonto(c.cuota, form.moneda)}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
          <button type="button" className="btn-secondary"
            onClick={() => set('etapas', [...form.etapas, { nombre: '', descripcion: '', honorarios: 0, abono: 0, cuotas: 1, opcional: false, activada: false, nota: '' }])}>
            <Plus className="h-4 w-4" /> Agregar etapa o servicio
          </button>
          <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-2">
            <span className="text-sm font-medium text-blue-900">Total comprometido</span>
            <span className="font-mono font-semibold text-blue-900">{formatoMonto(total, form.moneda)}</span>
          </div>
          <p className="text-xs text-gray-400">Los bloques “solo si corresponde” no suman al total comprometido.</p>
        </section>

        <section className="space-y-3">
          <label className="flex items-center gap-2 font-semibold text-gray-900">
            <input type="checkbox" checked={form.exitoActivo} onChange={(e) => set('exitoActivo', e.target.checked)} />
            Incluir cobro a éxito
          </label>
          {form.exitoActivo && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Abono inicial</label>
                  <input className="input" type="number" min={0} value={form.exitoAbono} onChange={(e) => set('exitoAbono', parseFloat(e.target.value) || 0)} /></div>
                <div><label className="label">% del monto recibido</label>
                  <input className="input" type="number" min={0} max={100} value={form.exitoPct} onChange={(e) => set('exitoPct', parseFloat(e.target.value) || 0)} /></div>
              </div>
              <p className="text-xs text-gray-400">El abono no se descuenta del porcentaje. Se paga con cada giro, sin cuotas. Si no se recibe nada, solo se debe el abono.</p>
            </>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Condiciones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="label">Moneda</label>
              <select className="input" value={form.moneda} onChange={(e) => set('moneda', e.target.value as Moneda)}>
                <option value="CLP">Pesos chilenos ($)</option><option value="UF">UF</option>
              </select></div>
            {form.moneda === 'UF' && (
              <div><label className="label">Valor UF (CLP)</label>
                <input className="input" type="number" min={0} step="0.01" value={form.valorUf} onChange={(e) => set('valorUf', e.target.value)} /></div>
            )}
            <div><label className="label">Fecha</label>
              <input className="input" type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} /></div>
            <div><label className="label">Vigencia (días)</label>
              <input className="input" type="number" min={1} value={form.vigenciaDias} onChange={(e) => set('vigenciaDias', parseInt(e.target.value, 10) || VIGENCIA_NORMAL)} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.vigenciaDias === VIGENCIA_AUDIENCIA_CERCANA}
              onChange={(e) => set('vigenciaDias', e.target.checked ? VIGENCIA_AUDIENCIA_CERCANA : VIGENCIA_NORMAL)} />
            Audiencia cercana (vigencia {VIGENCIA_AUDIENCIA_CERCANA} días)
          </label>
          <div><label className="label">Impuestos</label>
            <select className="input" value={form.impuestos} onChange={(e) => set('impuestos', e.target.value as Form['impuestos'])}>
              <option value="neutro">Documento tributario que corresponda</option>
              <option value="bruto">Montos brutos (incluyen impuestos)</option>
              <option value="neto">Montos netos (más IVA)</option>
            </select></div>
          {!esNuevo && (
            <div><label className="label">Estado</label>
              <select className="input" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
                <option value="BORRADOR">Borrador</option><option value="ENVIADO">Enviado</option>
                <option value="ACEPTADO">Aceptado</option><option value="RECHAZADO">Rechazado</option><option value="VENCIDO">Vencido</option>
              </select></div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">Textos del documento</h2>
          <div><label className="label">Por qué contratar (opcional)</label>
            <textarea className="input" rows={3} value={form.porQue} onChange={(e) => set('porQue', e.target.value)} /></div>
          <div><label className="label">Gastos no incluidos</label>
            <textarea className="input" rows={4} value={form.gastos} onChange={(e) => set('gastos', e.target.value)} /></div>
          <div><label className="label">Condiciones de pago</label>
            <textarea className="input" rows={3} value={form.condicionesPago} onChange={(e) => set('condicionesPago', e.target.value)} /></div>
          <div><label className="label">Cláusulas (una por línea, se numeran solas)</label>
            <textarea className="input" rows={6} value={form.clausulas} onChange={(e) => set('clausulas', e.target.value)} /></div>
          <p className="text-xs text-gray-400">Son un punto de partida. Revísalos y adáptalos a tu práctica y a la normativa vigente.</p>
        </section>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3">
            <button type="button" className="btn-primary" disabled={guardando} onClick={guardar}>
              <Save className="h-4 w-4" /> {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <Link href="/presupuestos" className="btn-secondary">Cancelar</Link>
          </div>
          {!esNuevo && <button type="button" className="text-sm text-red-500 hover:text-red-700" onClick={eliminar}>Eliminar</button>}
        </div>
      </div>
    </div>
  )
}
