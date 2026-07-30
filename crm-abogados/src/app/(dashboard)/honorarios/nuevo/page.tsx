'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { formatMonto, sumarDiasISO, hoyChile } from '@/lib/utils'

type CuotaBorrador = { monto: string; fechaPago: string }

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "2026-08-05" → "5 de agosto". Sin new Date() para no correr el día por zona horaria. */
function fechaEnPalabras(fechaISO: string): string {
  const [, m, d] = fechaISO.split('-').map(Number)
  return `${d} de ${MESES[m - 1]}`
}

/** "2026-08-05" → "5-ago" */
function fechaAbreviada(fechaISO: string): string {
  const [, m, d] = fechaISO.split('-').map(Number)
  return `${d}-${MESES[m - 1].slice(0, 3)}`
}

/** Fecha de la cuota n° i (0-indexada) según la fecha inicial y la periodicidad. */
function fechaDeCuota(i: number, primeraFecha: string, periodicidad: string): string {
  if (periodicidad === 'MENSUAL') return sumarMeses(primeraFecha, i)
  if (periodicidad === 'QUINCENAL') return sumarDiasISO(primeraFecha, i * 15)
  return sumarDiasISO(primeraFecha, i * 7)
}

/** Suma meses a una fecha YYYY-MM-DD ajustando el día al último del mes cuando corresponde (31-ene + 1 mes = 28/29-feb). */
function sumarMeses(fechaISO: string, meses: number): string {
  const [y, m, d] = fechaISO.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1 + meses, 1))
  const ultimoDia = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()
  base.setUTCDate(Math.min(d, ultimoDia))
  return base.toISOString().slice(0, 10)
}

function NuevoHonorarioForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Solo rutas internas: evita que un enlace manipulado redirija fuera del CRM.
  const volverParam = searchParams.get('volver')
  const volver = volverParam && /^\/[^/\\]/.test(volverParam) ? volverParam : '/honorarios'
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [causas, setCausas] = useState<{ id: string; rol: string }[]>([])
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    tipo: 'HONORARIO',
    estado: 'PENDIENTE',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVence: '',
    notas: '',
    clienteId: searchParams.get('clienteId') || '',
    causaId: searchParams.get('causaId') || '',
  })

  const [enCuotas, setEnCuotas] = useState(false)
  const [plan, setPlan] = useState({ numero: '3', primeraFecha: '', periodicidad: 'MENSUAL' })
  const [cuotas, setCuotas] = useState<CuotaBorrador[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/clientes').then((r) => r.json()),
      fetch('/api/causas').then((r) => r.json()),
    ]).then(([c, ca]) => { setClientes(c); setCausas(ca) })
  }, [])

  // La primera cuota se sugiere a un mes. Se calcula al montar (no en el
  // estado inicial) para que la fecha sea la de Chile y no la del servidor.
  useEffect(() => {
    setPlan((p) => (p.primeraFecha ? p : { ...p, primeraFecha: sumarMeses(hoyChile(), 1) }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const generarCuotas = (numeroDirecto?: number) => {
    const total = parseFloat(form.monto)
    const n = numeroDirecto ?? parseInt(plan.numero, 10)
    if (!total || total <= 0) return toast.error('Primero ingresa el monto total')
    if (!n || n < 1) return toast.error('Indica cuántas cuotas')
    if (!plan.primeraFecha) return toast.error('Indica la fecha de la primera cuota')

    // Reparto en pesos enteros: la última cuota absorbe el resto para que sume exacto.
    const base = Math.floor(total / n)
    const nuevas: CuotaBorrador[] = Array.from({ length: n }, (_, i) => {
      const monto = i === n - 1 ? total - base * (n - 1) : base
      return { monto: String(monto), fechaPago: fechaDeCuota(i, plan.primeraFecha, plan.periodicidad) }
    })
    setCuotas(nuevas)
  }

  // Si se cambia la fecha inicial o la periodicidad con cuotas ya generadas,
  // se recorren las fechas y se respetan los montos (que pueden estar editados).
  useEffect(() => {
    if (!plan.primeraFecha) return
    setCuotas((prev) => prev.length === 0 ? prev : prev.map((c, i) => ({ ...c, fechaPago: fechaDeCuota(i, plan.primeraFecha, plan.periodicidad) })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.primeraFecha, plan.periodicidad])

  const actualizarCuota = (i: number, campo: keyof CuotaBorrador, valor: string) => {
    setCuotas((prev) => prev.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)))
  }

  const eliminarCuota = (i: number) => setCuotas((prev) => prev.filter((_, idx) => idx !== i))

  const agregarCuotaManual = () => setCuotas((prev) => [...prev, { monto: '', fechaPago: '' }])

  const cuotasValidas = enCuotas ? cuotas.filter((c) => c.monto && c.fechaPago) : []
  const sumaCuotas = cuotasValidas.reduce((s, c) => s + parseFloat(c.monto || '0'), 0)
  const totalHonorario = parseFloat(form.monto || '0')
  const descuadre = cuotasValidas.length > 0 && Math.abs(sumaCuotas - totalHonorario) > 0.5

  // Resumen en palabras: es lo que quien atiende le va a decir al cliente,
  // así que se muestra tal cual se conversa ("3 cuotas de $300.000 desde...").
  const ordenadas = [...cuotasValidas].sort((a, b) => a.fechaPago.localeCompare(b.fechaPago))
  const montosIguales = ordenadas.length > 1 && ordenadas.every((c) => parseFloat(c.monto) === parseFloat(ordenadas[0].monto))
  const resumenCuotas = ordenadas.length === 0 ? '' : ordenadas.length === 1
    ? `1 cuota de ${formatMonto(parseFloat(ordenadas[0].monto))} el ${fechaEnPalabras(ordenadas[0].fechaPago)}`
    : montosIguales
      ? `${ordenadas.length} cuotas de ${formatMonto(parseFloat(ordenadas[0].monto))} desde el ${fechaEnPalabras(ordenadas[0].fechaPago)}`
      : `${ordenadas.length} cuotas por un total de ${formatMonto(sumaCuotas)} desde el ${fechaEnPalabras(ordenadas[0].fechaPago)}`
  const fechasResumen = ordenadas.length > 6
    ? [...ordenadas.slice(0, 3).map((c) => fechaAbreviada(c.fechaPago)), '…', fechaAbreviada(ordenadas[ordenadas.length - 1].fechaPago)]
    : ordenadas.map((c) => fechaAbreviada(c.fechaPago))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/honorarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // Un honorario con cuotas pactadas nace como PARCIAL para que el
          // cobrado/pendiente se calcule a partir de las cuotas pagadas.
          estado: cuotasValidas.length > 0 ? 'PARCIAL' : form.estado,
          monto: parseFloat(form.monto),
          fechaEmision: new Date(form.fechaEmision).toISOString(),
          fechaVence: form.fechaVence ? new Date(form.fechaVence).toISOString() : null,
          causaId: form.causaId || null,
        }),
      })
      if (!res.ok) throw new Error()
      const honorario = await res.json()

      let fallidas = 0
      for (const c of cuotasValidas) {
        const r = await fetch('/api/cuotas-honorario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ honorarioId: honorario.id, monto: parseFloat(c.monto), fechaPago: c.fechaPago }),
        })
        if (!r.ok) fallidas++
      }

      if (fallidas > 0) {
        toast.error(`Honorario guardado, pero ${fallidas} cuota(s) no se pudieron registrar. Revísalas en Editar.`)
      } else if (cuotasValidas.length > 0) {
        toast.success(`Honorario registrado con ${cuotasValidas.length} cuotas y sus recordatorios`)
      } else {
        toast.success('Honorario registrado')
      }
      router.push(volver)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-lg">
      <Link href={volver} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo honorario</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Descripción *</label>
          <input name="descripcion" value={form.descripcion} onChange={handleChange} required className="input" placeholder="Ej: Honorarios causa C-1234-2024" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Monto total (CLP) *</label>
            <input name="monto" type="number" value={form.monto} onChange={handleChange} required className="input" placeholder="850000" min="0" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="input">
              <option value="HONORARIO">Honorario</option>
              <option value="ANTICIPO">Anticipo</option>
              <option value="GASTO">Gasto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Cliente *</label>
          <select name="clienteId" value={form.clienteId} onChange={handleChange} required className="input">
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Causa (opcional)</label>
          <select name="causaId" value={form.causaId} onChange={handleChange} className="input">
            <option value="">Sin causa asociada</option>
            {causas.map((c) => <option key={c.id} value={c.id}>{c.rol}</option>)}
          </select>
        </div>

        {/* Pago en cuotas */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enCuotas}
              onChange={(e) => { setEnCuotas(e.target.checked); if (!e.target.checked) setCuotas([]) }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              Pactar pago en cuotas
            </span>
          </label>

          {enCuotas && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Cada cuota crea automáticamente una tarea de recordatorio de cobro con su fecha.
              </p>

              <div>
                <label className="label">¿En cuántas cuotas?</label>
                <div className="flex gap-2">
                  {[2, 3, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setPlan((p) => ({ ...p, numero: String(n) })); generarCuotas(n) }}
                      className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                        plan.numero === String(n) && cuotas.length === n
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">U otro n°</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={plan.numero}
                    onChange={(e) => setPlan((p) => ({ ...p, numero: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">1ª cuota</label>
                  <input
                    type="date"
                    value={plan.primeraFecha}
                    onChange={(e) => setPlan((p) => ({ ...p, primeraFecha: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Cada</label>
                  <select
                    value={plan.periodicidad}
                    onChange={(e) => setPlan((p) => ({ ...p, periodicidad: e.target.value }))}
                    className="input"
                  >
                    <option value="MENSUAL">Mes</option>
                    <option value="QUINCENAL">15 días</option>
                    <option value="SEMANAL">Semana</option>
                  </select>
                </div>
              </div>

              <button type="button" onClick={() => generarCuotas()} className="btn-secondary w-full justify-center">
                Generar cuotas
              </button>

              {cuotas.length > 0 && (
                <div className="space-y-2">
                  {cuotas.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-6 flex-shrink-0">{i + 1}.</span>
                      <input
                        type="number"
                        min="0"
                        value={c.monto}
                        onChange={(e) => actualizarCuota(i, 'monto', e.target.value)}
                        className="input flex-1"
                        placeholder="Monto"
                      />
                      <input
                        type="date"
                        value={c.fechaPago}
                        onChange={(e) => actualizarCuota(i, 'fechaPago', e.target.value)}
                        className="input flex-1"
                      />
                      <button type="button" onClick={() => eliminarCuota(i)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <button type="button" onClick={agregarCuotaManual} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Agregar cuota
                    </button>
                    <p className={`text-xs font-medium ${descuadre ? 'text-amber-600' : 'text-gray-500'}`}>
                      Suma: {formatMonto(sumaCuotas)} de {formatMonto(totalHonorario)}
                    </p>
                  </div>

                  {descuadre && (
                    <p className="text-xs text-amber-600">
                      La suma de las cuotas no coincide con el monto total. Puedes guardarlo igual si así lo pactaste.
                    </p>
                  )}

                  {resumenCuotas && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                      <p className="text-sm font-semibold text-blue-900">{resumenCuotas}</p>
                      <p className="text-xs text-blue-700 mt-0.5">{fechasResumen.join(' · ')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha emisión *</label>
            <input name="fechaEmision" type="date" value={form.fechaEmision} onChange={handleChange} required className="input" />
          </div>
          <div>
            <label className="label">Fecha vencimiento</label>
            <input name="fechaVence" type="date" value={form.fechaVence} onChange={handleChange} className="input" />
          </div>
        </div>

        {cuotasValidas.length > 0 ? (
          <p className="text-xs text-gray-500">
            El honorario se guardará como <span className="font-semibold">Parcial</span>, y se irá marcando como cobrado a medida que pagues cada cuota.
          </p>
        ) : (
          <div>
            <label className="label">Estado inicial</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADO">Pagado</option>
              <option value="PARCIAL">Parcial</option>
            </select>
          </div>
        )}

        <div>
          <label className="label">Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="input resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <Link href={volver} className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default function NuevoHonorarioPage() {
  return <Suspense><NuevoHonorarioForm /></Suspense>
}
