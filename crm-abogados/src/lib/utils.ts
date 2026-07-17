import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

const CHILE_TZ = 'America/Santiago'

/**
 * "Hoy" en Chile como YYYY-MM-DD. El servidor (Vercel) corre en UTC, así que
 * `new Date()` solo no basta — de noche en Chile, UTC ya está en el día
 * siguiente y todo lo que dependa de "hoy" (semáforos, "Hoy"/"Mañana",
 * vencimientos) se adelanta varias horas respecto a la hora real de Chile.
 */
export function hoyChile(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CHILE_TZ }).format(new Date())
}

/** Suma/resta días a una fecha YYYY-MM-DD sin ambigüedad de zona horaria. */
export function sumarDiasISO(fechaISO: string, dias: number): string {
  const d = new Date(fechaISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula lo realmente cobrado/pendiente de un honorario. Un honorario
 * "PARCIAL" no debe contar como 100% pendiente si ya tiene cuotas pagadas —
 * se resta lo que sus cuotas marcadas como pagadas ya cubrieron. Sin cuotas
 * registradas para un PARCIAL, se asume nada cobrado (comportamiento previo).
 */
export function splitHonorarioCobrado(
  honorario: { estado: string; monto: number },
  cuotas: { monto: number; pagada: number }[],
): { cobrado: number; pendiente: number } {
  if (honorario.estado === 'ANULADO') return { cobrado: 0, pendiente: 0 }
  if (honorario.estado === 'PAGADO') return { cobrado: honorario.monto, pendiente: 0 }
  if (honorario.estado === 'PARCIAL' && cuotas.length > 0) {
    const cobrado = cuotas.filter((c) => c.pagada === 1).reduce((s, c) => s + c.monto, 0)
    return { cobrado, pendiente: Math.max(honorario.monto - cobrado, 0) }
  }
  return { cobrado: 0, pendiente: honorario.monto }
}

export function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

export function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const expected = 11 - (sum % 11)
  if (expected === 11) return dv === '0'
  if (expected === 10) return dv === 'K'
  return dv === expected.toString()
}

export function formatPhoneWhatsApp(celular: string): string {
  const digits = celular.replace(/\D/g, '')
  if (digits.startsWith('56')) return digits
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`
  if (digits.length === 8) return `569${digits}`
  return digits
}

export function formatMonto(monto: number, moneda = 'CLP'): string {
  if (moneda === 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(monto)
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda,
  }).format(monto)
}

export function formatFecha(date: Date | string, fmt = "d 'de' MMMM, yyyy"): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, fmt, { locale: es })
}

export function formatFechaCorta(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy')
}

/**
 * Fecha y hora en zona horaria de Chile, para campos que sí representan un
 * instante real (vencimiento de tarea, gestiones) — a diferencia de los
 * campos "solo fecha" (plazos, honorarios, etc.), que se muestran con
 * formatFechaCorta sin conversión de zona horaria porque son fechas
 * naive, no instantes reales.
 */
export function formatFechaHoraChile(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const hora = formatInTimeZone(d, CHILE_TZ, 'HH:mm')
  return hora === '00:00'
    ? formatInTimeZone(d, CHILE_TZ, 'dd/MM/yyyy')
    : formatInTimeZone(d, CHILE_TZ, 'dd/MM/yyyy HH:mm') + ' hrs'
}

/** Formatea una fecha ISO al valor esperado por <input type="datetime-local"> (hora local, sin zona). */
export function toDatetimeLocalValue(date: string): string {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatFechaRelativa(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const dISO = d.toISOString().slice(0, 10)
  const hoy = hoyChile()
  if (dISO === hoy) return 'Hoy'
  if (dISO === sumarDiasISO(hoy, 1)) return 'Mañana'
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function estaVencido(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().slice(0, 10) < hoyChile()
}

export function esCritico(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const limite = addDays(new Date(), 3)
  return d <= limite && !isPast(d)
}

// Ventana más amplia para fechas de prescripción penal (Ley 21.719) — requieren
// mucha más anticipación que un plazo procesal común.
export function esCriticoPrescripcion(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const limite = addDays(new Date(), 90)
  return d <= limite && !isPast(d)
}

export const ESTADOS_CAUSA = {
  EN_TRAMITE: { label: 'En Trámite', color: 'bg-blue-100 text-blue-800' },
  TERMINADA: { label: 'Terminada', color: 'bg-green-100 text-green-800' },
  SUSPENDIDA: { label: 'Suspendida', color: 'bg-yellow-100 text-yellow-800' },
  ARCHIVADA: { label: 'Archivada', color: 'bg-gray-100 text-gray-800' },
} as const

export const ESTADOS_HONORARIO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  PAGADO: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  PARCIAL: { label: 'Parcial', color: 'bg-orange-100 text-orange-800' },
  ANULADO: { label: 'Anulado', color: 'bg-red-100 text-red-800' },
} as const

export const ESTADOS_PLAZO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETADO: { label: 'Completado', color: 'bg-green-100 text-green-800' },
  VENCIDO: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
} as const

export const TIPOS_CAUSA = ['Civil', 'Laboral', 'Familia', 'Penal', 'Comercial', 'Tributario', 'Administrativo', 'Constitucional', 'Otro']

const KEYWORDS_POR_TIPO: Record<string, string[]> = {
  Civil:          ['Civil', 'Letras'],
  Laboral:        ['Trabajo', 'Laboral', 'Previsional', 'Cobranza'],
  Familia:        ['Familia'],
  Penal:          ['Garantía', 'Penal', 'Crimen', 'Fiscalía'],
  Comercial:      ['Civil', 'Letras', 'Comercio'],
  Tributario:     ['Tributario', 'Aduanero', 'SII'],
  Administrativo: ['Administrativo', 'Contencioso', 'Contraloría'],
  Constitucional: ['Constitucional', 'Electoral'],
  Otro:           [],
}

export function tribunalesPorTipo(tipo: string, todos: TribunalInfo[]): TribunalInfo[] {
  const keywords = KEYWORDS_POR_TIPO[tipo]
  if (!keywords || keywords.length === 0) return todos
  return todos.filter((t) => keywords.some((k) => t.nombre.toLowerCase().includes(k.toLowerCase())))
}

export const ESTADOS_TAREA = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  EN_PROGRESO: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
  COMPLETADA: { label: 'Completada', color: 'bg-green-100 text-green-800' },
  CANCELADA: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800' },
} as const

export const PRIORIDADES_TAREA = {
  BAJA: { label: 'Baja', color: 'bg-gray-100 text-gray-500' },
  MEDIA: { label: 'Media', color: 'bg-blue-100 text-blue-700' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
} as const

export type UrgenciaTarea = 'roja' | 'amarilla' | 'verde' | null

export function urgenciaTarea(fecha: string | null | undefined): UrgenciaTarea {
  if (!fecha) return null
  const d = new Date(fecha)
  if (d.toISOString().slice(0, 10) <= hoyChile()) return 'roja'
  if (d <= addDays(new Date(), 2)) return 'amarilla'
  return 'verde'
}

export const URGENCIA_CLASES = {
  roja:     { border: 'border-l-4 border-red-500',    bg: 'bg-red-50',    texto: 'text-red-700',    label: 'Vencida' },
  amarilla: { border: 'border-l-4 border-yellow-400', bg: 'bg-yellow-50', texto: 'text-yellow-700', label: 'Vence pronto' },
  verde:    { border: 'border-l-4 border-green-500',  bg: 'bg-green-50',  texto: 'text-green-700',  label: 'A tiempo' },
} as const

export interface TribunalInfo {
  nombre: string
  region: string
}

export const TRIBUNALES_CHILE: TribunalInfo[] = [
  // Región Metropolitana
  { nombre: '1° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '2° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '3° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '4° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '5° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '6° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '7° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '8° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '9° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '10° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '11° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '12° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '13° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '14° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '15° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '16° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '17° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '18° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '19° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '20° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '21° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '26° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '27° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '28° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '29° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '30° Juzgado Civil de Santiago', region: 'Región Metropolitana' },
  { nombre: '1° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '2° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '3° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '4° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '5° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '6° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '7° Juzgado de Letras del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Cobranza Laboral y Previsional de Santiago', region: 'Región Metropolitana' },
  { nombre: 'Inspección del Trabajo de Santiago', region: 'Región Metropolitana' },
  { nombre: '1° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '2° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '3° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '4° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '5° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '6° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '7° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '8° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '9° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: '10° Juzgado de Familia de Santiago', region: 'Región Metropolitana' },
  { nombre: 'Centro de Mediación Familiar de Santiago', region: 'Región Metropolitana' },
  { nombre: '1° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: '2° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: '3° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: '4° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: '5° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: '6° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: '7° Juzgado de Garantía de Santiago', region: 'Región Metropolitana' },
  { nombre: 'Fiscalía Local de Santiago', region: 'Región Metropolitana' },
  { nombre: '1° Tribunal de Juicio Oral en lo Penal de Santiago', region: 'Región Metropolitana' },
  { nombre: '2° Tribunal de Juicio Oral en lo Penal de Santiago', region: 'Región Metropolitana' },
  { nombre: '3° Tribunal de Juicio Oral en lo Penal de Santiago', region: 'Región Metropolitana' },
  { nombre: '4° Tribunal de Juicio Oral en lo Penal de Santiago', region: 'Región Metropolitana' },
  { nombre: '5° Tribunal de Juicio Oral en lo Penal de Santiago', region: 'Región Metropolitana' },
  { nombre: '7° Tribunal de Juicio Oral en lo Penal de Santiago', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Letras de San Bernardo', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Letras de Puente Alto', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Letras de Melipilla', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Letras de Talagante', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Garantía de Pudahuel', region: 'Región Metropolitana' },
  { nombre: 'Fiscalía Local de Pudahuel', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Garantía de Maipú', region: 'Región Metropolitana' },
  { nombre: 'Fiscalía Local de Maipú', region: 'Región Metropolitana' },
  { nombre: 'Juzgado de Garantía de San Miguel', region: 'Región Metropolitana' },
  { nombre: 'Fiscalía Local de San Miguel', region: 'Región Metropolitana' },
  { nombre: 'Corte de Apelaciones de Santiago', region: 'Región Metropolitana' },
  { nombre: 'Corte de Apelaciones de San Miguel', region: 'Región Metropolitana' },
  // Valparaíso
  { nombre: '1° Juzgado Civil de Valparaíso', region: 'Valparaíso' },
  { nombre: '2° Juzgado Civil de Valparaíso', region: 'Valparaíso' },
  { nombre: '3° Juzgado Civil de Valparaíso', region: 'Valparaíso' },
  { nombre: '4° Juzgado Civil de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Juzgado de Letras del Trabajo de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Inspección del Trabajo de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Juzgado de Familia de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Centro de Mediación Familiar de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Juzgado de Garantía de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Fiscalía Local de Valparaíso', region: 'Valparaíso' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Valparaíso', region: 'Valparaíso' },
  { nombre: '1° Juzgado Civil de Viña del Mar', region: 'Valparaíso' },
  { nombre: '2° Juzgado Civil de Viña del Mar', region: 'Valparaíso' },
  { nombre: 'Juzgado de Letras del Trabajo de Viña del Mar', region: 'Valparaíso' },
  { nombre: 'Inspección del Trabajo de Viña del Mar', region: 'Valparaíso' },
  { nombre: 'Juzgado de Garantía de Viña del Mar', region: 'Valparaíso' },
  { nombre: 'Fiscalía Local de Viña del Mar', region: 'Valparaíso' },
  { nombre: 'Juzgado de Letras de San Antonio', region: 'Valparaíso' },
  { nombre: 'Juzgado de Letras de Quillota', region: 'Valparaíso' },
  { nombre: 'Juzgado de Letras de Los Andes', region: 'Valparaíso' },
  { nombre: 'Juzgado de Letras de San Felipe', region: 'Valparaíso' },
  { nombre: 'Corte de Apelaciones de Valparaíso', region: 'Valparaíso' },
  // Biobío
  { nombre: '1° Juzgado Civil de Concepción', region: 'Biobío' },
  { nombre: '2° Juzgado Civil de Concepción', region: 'Biobío' },
  { nombre: '3° Juzgado Civil de Concepción', region: 'Biobío' },
  { nombre: 'Juzgado de Letras del Trabajo de Concepción', region: 'Biobío' },
  { nombre: 'Inspección del Trabajo de Concepción', region: 'Biobío' },
  { nombre: 'Juzgado de Familia de Concepción', region: 'Biobío' },
  { nombre: 'Centro de Mediación Familiar de Concepción', region: 'Biobío' },
  { nombre: 'Juzgado de Garantía de Concepción', region: 'Biobío' },
  { nombre: 'Fiscalía Local de Concepción', region: 'Biobío' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Concepción', region: 'Biobío' },
  { nombre: 'Juzgado de Letras de Talcahuano', region: 'Biobío' },
  { nombre: 'Juzgado de Letras de Chillán', region: 'Biobío' },
  { nombre: 'Juzgado de Letras de Los Ángeles', region: 'Biobío' },
  { nombre: 'Corte de Apelaciones de Concepción', region: 'Biobío' },
  { nombre: 'Corte de Apelaciones de Chillán', region: 'Biobío' },
  // Araucanía
  { nombre: '1° Juzgado Civil de Temuco', region: 'Araucanía' },
  { nombre: '2° Juzgado Civil de Temuco', region: 'Araucanía' },
  { nombre: 'Juzgado de Letras del Trabajo de Temuco', region: 'Araucanía' },
  { nombre: 'Inspección del Trabajo de Temuco', region: 'Araucanía' },
  { nombre: 'Juzgado de Familia de Temuco', region: 'Araucanía' },
  { nombre: 'Centro de Mediación Familiar de Temuco', region: 'Araucanía' },
  { nombre: 'Juzgado de Garantía de Temuco', region: 'Araucanía' },
  { nombre: 'Fiscalía Local de Temuco', region: 'Araucanía' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Temuco', region: 'Araucanía' },
  { nombre: 'Juzgado de Letras de Angol', region: 'Araucanía' },
  { nombre: 'Corte de Apelaciones de Temuco', region: 'Araucanía' },
  // Los Lagos
  { nombre: 'Juzgado Civil de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Juzgado de Letras del Trabajo de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Inspección del Trabajo de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Juzgado de Familia de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Centro de Mediación Familiar de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Juzgado de Garantía de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Fiscalía Local de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Puerto Montt', region: 'Los Lagos' },
  { nombre: 'Juzgado de Letras de Osorno', region: 'Los Lagos' },
  { nombre: 'Juzgado de Letras de Castro', region: 'Los Lagos' },
  { nombre: 'Corte de Apelaciones de Puerto Montt', region: 'Los Lagos' },
  // Maule
  { nombre: 'Juzgado Civil de Talca', region: 'Maule' },
  { nombre: 'Juzgado de Letras del Trabajo de Talca', region: 'Maule' },
  { nombre: 'Inspección del Trabajo de Talca', region: 'Maule' },
  { nombre: 'Juzgado de Familia de Talca', region: 'Maule' },
  { nombre: 'Centro de Mediación Familiar de Talca', region: 'Maule' },
  { nombre: 'Juzgado de Garantía de Talca', region: 'Maule' },
  { nombre: 'Fiscalía Local de Talca', region: 'Maule' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Talca', region: 'Maule' },
  { nombre: 'Juzgado de Letras de Curicó', region: 'Maule' },
  { nombre: 'Juzgado de Letras de Linares', region: 'Maule' },
  { nombre: 'Corte de Apelaciones de Talca', region: 'Maule' },
  // O'Higgins
  { nombre: 'Juzgado Civil de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Juzgado de Letras del Trabajo de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Inspección del Trabajo de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Juzgado de Familia de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Centro de Mediación Familiar de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Juzgado de Garantía de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Fiscalía Local de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Rancagua', region: 'O\'Higgins' },
  { nombre: 'Corte de Apelaciones de Rancagua', region: 'O\'Higgins' },
  // Coquimbo
  { nombre: 'Juzgado Civil de La Serena', region: 'Coquimbo' },
  { nombre: 'Juzgado de Letras del Trabajo de La Serena', region: 'Coquimbo' },
  { nombre: 'Inspección del Trabajo de La Serena', region: 'Coquimbo' },
  { nombre: 'Juzgado de Familia de La Serena', region: 'Coquimbo' },
  { nombre: 'Centro de Mediación Familiar de La Serena', region: 'Coquimbo' },
  { nombre: 'Juzgado de Garantía de La Serena', region: 'Coquimbo' },
  { nombre: 'Fiscalía Local de La Serena', region: 'Coquimbo' },
  { nombre: 'Juzgado de Letras de Coquimbo', region: 'Coquimbo' },
  { nombre: 'Juzgado de Letras de Ovalle', region: 'Coquimbo' },
  { nombre: 'Corte de Apelaciones de La Serena', region: 'Coquimbo' },
  // Antofagasta
  { nombre: 'Juzgado Civil de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Juzgado de Letras del Trabajo de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Inspección del Trabajo de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Juzgado de Familia de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Centro de Mediación Familiar de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Juzgado de Garantía de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Fiscalía Local de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Antofagasta', region: 'Antofagasta' },
  { nombre: 'Juzgado de Letras de Calama', region: 'Antofagasta' },
  { nombre: 'Corte de Apelaciones de Antofagasta', region: 'Antofagasta' },
  // Atacama
  { nombre: 'Juzgado Civil de Copiapó', region: 'Atacama' },
  { nombre: 'Juzgado de Garantía de Copiapó', region: 'Atacama' },
  { nombre: 'Fiscalía Local de Copiapó', region: 'Atacama' },
  { nombre: 'Juzgado de Familia de Copiapó', region: 'Atacama' },
  { nombre: 'Centro de Mediación Familiar de Copiapó', region: 'Atacama' },
  { nombre: 'Corte de Apelaciones de Copiapó', region: 'Atacama' },
  // Tarapacá
  { nombre: 'Juzgado Civil de Iquique', region: 'Tarapacá' },
  { nombre: 'Juzgado de Letras del Trabajo de Iquique', region: 'Tarapacá' },
  { nombre: 'Inspección del Trabajo de Iquique', region: 'Tarapacá' },
  { nombre: 'Juzgado de Garantía de Iquique', region: 'Tarapacá' },
  { nombre: 'Fiscalía Local de Iquique', region: 'Tarapacá' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Iquique', region: 'Tarapacá' },
  { nombre: 'Corte de Apelaciones de Iquique', region: 'Tarapacá' },
  // Arica y Parinacota
  { nombre: 'Juzgado Civil de Arica', region: 'Arica y Parinacota' },
  { nombre: 'Juzgado de Garantía de Arica', region: 'Arica y Parinacota' },
  { nombre: 'Fiscalía Local de Arica', region: 'Arica y Parinacota' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Arica', region: 'Arica y Parinacota' },
  { nombre: 'Corte de Apelaciones de Arica', region: 'Arica y Parinacota' },
  // Los Ríos
  { nombre: 'Juzgado Civil de Valdivia', region: 'Los Ríos' },
  { nombre: 'Juzgado de Letras del Trabajo de Valdivia', region: 'Los Ríos' },
  { nombre: 'Inspección del Trabajo de Valdivia', region: 'Los Ríos' },
  { nombre: 'Juzgado de Garantía de Valdivia', region: 'Los Ríos' },
  { nombre: 'Fiscalía Local de Valdivia', region: 'Los Ríos' },
  { nombre: 'Corte de Apelaciones de Valdivia', region: 'Los Ríos' },
  // Aysén
  { nombre: 'Juzgado de Letras de Coyhaique', region: 'Aysén' },
  { nombre: 'Juzgado de Garantía de Coyhaique', region: 'Aysén' },
  { nombre: 'Fiscalía Local de Coyhaique', region: 'Aysén' },
  { nombre: 'Corte de Apelaciones de Coyhaique', region: 'Aysén' },
  // Magallanes
  { nombre: 'Juzgado Civil de Punta Arenas', region: 'Magallanes' },
  { nombre: 'Juzgado de Garantía de Punta Arenas', region: 'Magallanes' },
  { nombre: 'Fiscalía Local de Punta Arenas', region: 'Magallanes' },
  { nombre: 'Tribunal de Juicio Oral en lo Penal de Punta Arenas', region: 'Magallanes' },
  { nombre: 'Corte de Apelaciones de Punta Arenas', region: 'Magallanes' },
  // Nacional
  { nombre: 'Corte Suprema', region: 'Nacional' },
  { nombre: 'Tribunal Constitucional', region: 'Nacional' },
  { nombre: 'Tribunal de Defensa de la Libre Competencia', region: 'Nacional' },
  { nombre: 'Tribunal Ambiental de Santiago', region: 'Nacional' },
  { nombre: 'Tribunal Ambiental de Antofagasta', region: 'Nacional' },
  { nombre: 'Tribunal Ambiental de Valdivia', region: 'Nacional' },
]

export const TRIBUNALES_SANTIAGO = TRIBUNALES_CHILE
