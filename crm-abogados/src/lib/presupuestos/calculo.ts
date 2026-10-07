// Lógica de cálculo del presupuesto. Funciones puras, sin dependencias del CRM:
// se usan igual en pantalla, en PDF/Word y al convertir en honorarios.

export type Moneda = 'CLP' | 'UF'

export interface EtapaCalculo {
  honorarios: number
  abono: number
  cuotas: number
  opcional: boolean
  activada?: boolean
}

export const MAX_CUOTAS = 60
export const VIGENCIA_NORMAL = 15
export const VIGENCIA_AUDIENCIA_CERCANA = 5

const numero = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

/** Decimales que admite cada moneda: pesos enteros; UF con 2 decimales. */
export function decimales(moneda: Moneda): number {
  return moneda === 'UF' ? 2 : 0
}

export function redondear(valor: number, moneda: Moneda): number {
  const f = 10 ** decimales(moneda)
  return Math.round(valor * f) / f
}

/** saldo = max(0, honorarios − abono); cuota = saldo / n° de cuotas. */
export function calcEtapa(e: Pick<EtapaCalculo, 'honorarios' | 'abono' | 'cuotas'>, moneda: Moneda = 'CLP') {
  const honorarios = Math.max(0, numero(e.honorarios))
  const abono = Math.max(0, numero(e.abono))
  const saldo = redondear(Math.max(0, honorarios - abono), moneda)
  const cuotas = Math.max(0, Math.min(MAX_CUOTAS, Math.trunc(numero(e.cuotas))))
  const cuota = cuotas > 0 ? redondear(saldo / cuotas, moneda) : 0
  return { saldo, cuotas, cuota }
}

/**
 * Reparte el saldo en cuotas que suman EXACTO: la última absorbe el resto.
 * Sin esto, 100.000 en 3 cuotas daría 33.333 × 3 = 99.999.
 */
export function repartirSaldo(saldo: number, cuotas: number, moneda: Moneda = 'CLP'): number[] {
  const n = Math.max(0, Math.min(MAX_CUOTAS, Math.trunc(numero(cuotas))))
  if (n === 0 || saldo <= 0) return []
  const base = Math.floor((saldo / n) * 10 ** decimales(moneda)) / 10 ** decimales(moneda)
  const montos = Array<number>(n).fill(base)
  montos[n - 1] = redondear(saldo - base * (n - 1), moneda)
  return montos
}

/** Total comprometido: solo etapas fijas. Las "solo si corresponde" no suman. */
export function totalComprometido(etapas: EtapaCalculo[]): number {
  return etapas.filter((e) => !e.opcional).reduce((t, e) => t + Math.max(0, numero(e.honorarios)), 0)
}

/** Total que realmente se cobra: fijas + opcionales ya activadas. */
export function totalConActivadas(etapas: EtapaCalculo[]): number {
  return etapas
    .filter((e) => !e.opcional || e.activada)
    .reduce((t, e) => t + Math.max(0, numero(e.honorarios)), 0)
}

export function formatoMonto(valor: number, moneda: Moneda): string {
  if (moneda === 'UF') {
    return `UF ${valor.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }
  return `$${Math.round(valor).toLocaleString('es-CL')}`
}

/** Fecha de vigencia (YYYY-MM-DD) sin ambigüedad de zona horaria. */
export function vigenciaHasta(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + Math.max(1, Math.trunc(numero(dias)) || VIGENCIA_NORMAL))
  return d.toISOString().slice(0, 10)
}

export interface ExitoCalculo { activo: boolean; abono: number; pct: number }

/**
 * Cobro a éxito: el abono NO se descuenta del porcentaje. Si no se recibe
 * nada, solo se debe el abono. Sin cuotas: se paga con cada giro.
 */
export function montoExito(exito: ExitoCalculo, montoRecibido: number): number {
  if (!exito.activo) return 0
  const abono = Math.max(0, numero(exito.abono))
  const pct = Math.min(100, Math.max(0, numero(exito.pct)))
  return abono + Math.max(0, numero(montoRecibido)) * (pct / 100)
}
