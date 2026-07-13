import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

export function formatFechaRelativa(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function estaVencido(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return isPast(d) && !isToday(d)
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

export function tribunalesPorTipo(tipo: string, todos: string[]): string[] {
  const keywords = KEYWORDS_POR_TIPO[tipo]
  if (!keywords || keywords.length === 0) return todos
  return todos.filter((t) => keywords.some((k) => t.toLowerCase().includes(k.toLowerCase())))
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
  if (isToday(d) || isPast(d)) return 'roja'
  if (d <= addDays(new Date(), 2)) return 'amarilla'
  return 'verde'
}

export const URGENCIA_CLASES = {
  roja:     { border: 'border-l-4 border-red-500',    bg: 'bg-red-50',    texto: 'text-red-700',    label: 'Vencida' },
  amarilla: { border: 'border-l-4 border-yellow-400', bg: 'bg-yellow-50', texto: 'text-yellow-700', label: 'Vence pronto' },
  verde:    { border: 'border-l-4 border-green-500',  bg: 'bg-green-50',  texto: 'text-green-700',  label: 'A tiempo' },
} as const

export const TRIBUNALES_CHILE = [
  // Región Metropolitana
  '1° Juzgado Civil de Santiago',
  '2° Juzgado Civil de Santiago',
  '3° Juzgado Civil de Santiago',
  '4° Juzgado Civil de Santiago',
  '5° Juzgado Civil de Santiago',
  '6° Juzgado Civil de Santiago',
  '7° Juzgado Civil de Santiago',
  '8° Juzgado Civil de Santiago',
  '9° Juzgado Civil de Santiago',
  '10° Juzgado Civil de Santiago',
  '11° Juzgado Civil de Santiago',
  '12° Juzgado Civil de Santiago',
  '13° Juzgado Civil de Santiago',
  '14° Juzgado Civil de Santiago',
  '15° Juzgado Civil de Santiago',
  '16° Juzgado Civil de Santiago',
  '17° Juzgado Civil de Santiago',
  '18° Juzgado Civil de Santiago',
  '19° Juzgado Civil de Santiago',
  '20° Juzgado Civil de Santiago',
  '21° Juzgado Civil de Santiago',
  '26° Juzgado Civil de Santiago',
  '27° Juzgado Civil de Santiago',
  '28° Juzgado Civil de Santiago',
  '29° Juzgado Civil de Santiago',
  '30° Juzgado Civil de Santiago',
  '1° Juzgado de Letras del Trabajo de Santiago',
  '2° Juzgado de Letras del Trabajo de Santiago',
  '3° Juzgado de Letras del Trabajo de Santiago',
  '4° Juzgado de Letras del Trabajo de Santiago',
  '5° Juzgado de Letras del Trabajo de Santiago',
  '6° Juzgado de Letras del Trabajo de Santiago',
  '7° Juzgado de Letras del Trabajo de Santiago',
  'Juzgado de Cobranza Laboral y Previsional de Santiago',
  'Inspección del Trabajo de Santiago',
  '1° Juzgado de Familia de Santiago',
  '2° Juzgado de Familia de Santiago',
  '3° Juzgado de Familia de Santiago',
  '4° Juzgado de Familia de Santiago',
  '5° Juzgado de Familia de Santiago',
  '6° Juzgado de Familia de Santiago',
  '7° Juzgado de Familia de Santiago',
  '8° Juzgado de Familia de Santiago',
  '9° Juzgado de Familia de Santiago',
  '10° Juzgado de Familia de Santiago',
  'Centro de Mediación Familiar de Santiago',
  '1° Juzgado de Garantía de Santiago',
  '2° Juzgado de Garantía de Santiago',
  '3° Juzgado de Garantía de Santiago',
  '4° Juzgado de Garantía de Santiago',
  '5° Juzgado de Garantía de Santiago',
  '6° Juzgado de Garantía de Santiago',
  '7° Juzgado de Garantía de Santiago',
  'Fiscalía Local de Santiago',
  '1° Tribunal de Juicio Oral en lo Penal de Santiago',
  '2° Tribunal de Juicio Oral en lo Penal de Santiago',
  '3° Tribunal de Juicio Oral en lo Penal de Santiago',
  '4° Tribunal de Juicio Oral en lo Penal de Santiago',
  '5° Tribunal de Juicio Oral en lo Penal de Santiago',
  '7° Tribunal de Juicio Oral en lo Penal de Santiago',
  'Juzgado de Letras de San Bernardo',
  'Juzgado de Letras de Puente Alto',
  'Juzgado de Letras de Melipilla',
  'Juzgado de Letras de Talagante',
  'Juzgado de Garantía de Pudahuel',
  'Fiscalía Local de Pudahuel',
  'Juzgado de Garantía de Maipú',
  'Fiscalía Local de Maipú',
  'Juzgado de Garantía de San Miguel',
  'Fiscalía Local de San Miguel',
  'Corte de Apelaciones de Santiago',
  'Corte de Apelaciones de San Miguel',
  // Valparaíso
  '1° Juzgado Civil de Valparaíso',
  '2° Juzgado Civil de Valparaíso',
  '3° Juzgado Civil de Valparaíso',
  '4° Juzgado Civil de Valparaíso',
  'Juzgado de Letras del Trabajo de Valparaíso',
  'Inspección del Trabajo de Valparaíso',
  'Juzgado de Familia de Valparaíso',
  'Centro de Mediación Familiar de Valparaíso',
  'Juzgado de Garantía de Valparaíso',
  'Fiscalía Local de Valparaíso',
  'Tribunal de Juicio Oral en lo Penal de Valparaíso',
  '1° Juzgado Civil de Viña del Mar',
  '2° Juzgado Civil de Viña del Mar',
  'Juzgado de Letras del Trabajo de Viña del Mar',
  'Inspección del Trabajo de Viña del Mar',
  'Juzgado de Garantía de Viña del Mar',
  'Fiscalía Local de Viña del Mar',
  'Juzgado de Letras de San Antonio',
  'Juzgado de Letras de Quillota',
  'Juzgado de Letras de Los Andes',
  'Juzgado de Letras de San Felipe',
  'Corte de Apelaciones de Valparaíso',
  // Biobío
  '1° Juzgado Civil de Concepción',
  '2° Juzgado Civil de Concepción',
  '3° Juzgado Civil de Concepción',
  'Juzgado de Letras del Trabajo de Concepción',
  'Inspección del Trabajo de Concepción',
  'Juzgado de Familia de Concepción',
  'Centro de Mediación Familiar de Concepción',
  'Juzgado de Garantía de Concepción',
  'Fiscalía Local de Concepción',
  'Tribunal de Juicio Oral en lo Penal de Concepción',
  'Juzgado de Letras de Talcahuano',
  'Juzgado de Letras de Chillán',
  'Juzgado de Letras de Los Ángeles',
  'Corte de Apelaciones de Concepción',
  'Corte de Apelaciones de Chillán',
  // Araucanía
  '1° Juzgado Civil de Temuco',
  '2° Juzgado Civil de Temuco',
  'Juzgado de Letras del Trabajo de Temuco',
  'Inspección del Trabajo de Temuco',
  'Juzgado de Familia de Temuco',
  'Centro de Mediación Familiar de Temuco',
  'Juzgado de Garantía de Temuco',
  'Fiscalía Local de Temuco',
  'Tribunal de Juicio Oral en lo Penal de Temuco',
  'Juzgado de Letras de Angol',
  'Corte de Apelaciones de Temuco',
  // Los Lagos
  'Juzgado Civil de Puerto Montt',
  'Juzgado de Letras del Trabajo de Puerto Montt',
  'Inspección del Trabajo de Puerto Montt',
  'Juzgado de Familia de Puerto Montt',
  'Centro de Mediación Familiar de Puerto Montt',
  'Juzgado de Garantía de Puerto Montt',
  'Fiscalía Local de Puerto Montt',
  'Tribunal de Juicio Oral en lo Penal de Puerto Montt',
  'Juzgado de Letras de Osorno',
  'Juzgado de Letras de Castro',
  'Corte de Apelaciones de Puerto Montt',
  // Maule
  'Juzgado Civil de Talca',
  'Juzgado de Letras del Trabajo de Talca',
  'Inspección del Trabajo de Talca',
  'Juzgado de Familia de Talca',
  'Centro de Mediación Familiar de Talca',
  'Juzgado de Garantía de Talca',
  'Fiscalía Local de Talca',
  'Tribunal de Juicio Oral en lo Penal de Talca',
  'Juzgado de Letras de Curicó',
  'Juzgado de Letras de Linares',
  'Corte de Apelaciones de Talca',
  // O'Higgins
  'Juzgado Civil de Rancagua',
  'Juzgado de Letras del Trabajo de Rancagua',
  'Inspección del Trabajo de Rancagua',
  'Juzgado de Familia de Rancagua',
  'Centro de Mediación Familiar de Rancagua',
  'Juzgado de Garantía de Rancagua',
  'Fiscalía Local de Rancagua',
  'Tribunal de Juicio Oral en lo Penal de Rancagua',
  'Corte de Apelaciones de Rancagua',
  // Coquimbo
  'Juzgado Civil de La Serena',
  'Juzgado de Letras del Trabajo de La Serena',
  'Inspección del Trabajo de La Serena',
  'Juzgado de Familia de La Serena',
  'Centro de Mediación Familiar de La Serena',
  'Juzgado de Garantía de La Serena',
  'Fiscalía Local de La Serena',
  'Juzgado de Letras de Coquimbo',
  'Juzgado de Letras de Ovalle',
  'Corte de Apelaciones de La Serena',
  // Antofagasta
  'Juzgado Civil de Antofagasta',
  'Juzgado de Letras del Trabajo de Antofagasta',
  'Inspección del Trabajo de Antofagasta',
  'Juzgado de Familia de Antofagasta',
  'Centro de Mediación Familiar de Antofagasta',
  'Juzgado de Garantía de Antofagasta',
  'Fiscalía Local de Antofagasta',
  'Tribunal de Juicio Oral en lo Penal de Antofagasta',
  'Juzgado de Letras de Calama',
  'Corte de Apelaciones de Antofagasta',
  // Atacama
  'Juzgado Civil de Copiapó',
  'Juzgado de Garantía de Copiapó',
  'Fiscalía Local de Copiapó',
  'Juzgado de Familia de Copiapó',
  'Centro de Mediación Familiar de Copiapó',
  'Corte de Apelaciones de Copiapó',
  // Tarapacá
  'Juzgado Civil de Iquique',
  'Juzgado de Letras del Trabajo de Iquique',
  'Inspección del Trabajo de Iquique',
  'Juzgado de Garantía de Iquique',
  'Fiscalía Local de Iquique',
  'Tribunal de Juicio Oral en lo Penal de Iquique',
  'Corte de Apelaciones de Iquique',
  // Arica y Parinacota
  'Juzgado Civil de Arica',
  'Juzgado de Garantía de Arica',
  'Fiscalía Local de Arica',
  'Tribunal de Juicio Oral en lo Penal de Arica',
  'Corte de Apelaciones de Arica',
  // Los Ríos
  'Juzgado Civil de Valdivia',
  'Juzgado de Letras del Trabajo de Valdivia',
  'Inspección del Trabajo de Valdivia',
  'Juzgado de Garantía de Valdivia',
  'Fiscalía Local de Valdivia',
  'Corte de Apelaciones de Valdivia',
  // Aysén
  'Juzgado de Letras de Coyhaique',
  'Juzgado de Garantía de Coyhaique',
  'Fiscalía Local de Coyhaique',
  'Corte de Apelaciones de Coyhaique',
  // Magallanes
  'Juzgado Civil de Punta Arenas',
  'Juzgado de Garantía de Punta Arenas',
  'Fiscalía Local de Punta Arenas',
  'Tribunal de Juicio Oral en lo Penal de Punta Arenas',
  'Corte de Apelaciones de Punta Arenas',
  // Nacional
  'Corte Suprema',
  'Tribunal Constitucional',
  'Tribunal de Defensa de la Libre Competencia',
  'Tribunal Ambiental de Santiago',
  'Tribunal Ambiental de Antofagasta',
  'Tribunal Ambiental de Valdivia',
]

export const TRIBUNALES_SANTIAGO = TRIBUNALES_CHILE
