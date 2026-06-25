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

export type UrgenciaTarea = 'roja' | 'amarilla' | 'verde' | null

export function urgenciaTarea(fecha: string | null | undefined): UrgenciaTarea {
  if (!fecha) return null
  const d = new Date(fecha)
  if (isToday(d) || isPast(d)) return 'roja'
  if (d <= addDays(new Date(), 2)) return 'amarilla'
  return 'verde'
}

export const URGENCIA_CLASES: Record<NonNullable<UrgenciaTarea>, { border: string; bg: string; texto: string; label: string }> = {
  roja:     { border: 'border-l-4 border-red-500',    bg: 'bg-red-50',    texto: 'text-red-700',    label: 'Vencida' },
  amarilla: { border: 'border-l-4 border-yellow-400', bg: 'bg-yellow-50', texto: 'text-yellow-700', label: 'Vence pronto' },
  verde:    { border: 'border-l-4 border-green-500',  bg: 'bg-green-50',  texto: 'text-green-700',  label: 'A tiempo' },
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

export const TIPOS_CAUSA = ['Civil', 'Laboral', 'Familia', 'Penal', 'Comercial', 'Tributario', 'Administrativo', 'Constitucional', 'Otro']

export const TRIBUNALES_CHILE = [
  // ── Corte Suprema ──
  'Corte Suprema',

  // ── Región Metropolitana · Santiago ──
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
  '22° Juzgado Civil de Santiago',
  '23° Juzgado Civil de Santiago',
  '24° Juzgado Civil de Santiago',
  '25° Juzgado Civil de Santiago',
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
  '1° Juzgado de Familia de Santiago',
  '2° Juzgado de Familia de Santiago',
  '3° Juzgado de Familia de Santiago',
  '4° Juzgado de Familia de Santiago',
  '5° Juzgado de Familia de Santiago',
  '1° Juzgado de Garantía de Santiago',
  '2° Juzgado de Garantía de Santiago',
  '3° Juzgado de Garantía de Santiago',
  '4° Juzgado de Garantía de Santiago',
  '5° Juzgado de Garantía de Santiago',
  '6° Juzgado de Garantía de Santiago',
  '7° Juzgado de Garantía de Santiago',
  '8° Juzgado de Garantía de Santiago',
  '9° Juzgado de Garantía de Santiago',
  '10° Juzgado de Garantía de Santiago',
  '1° Tribunal de Juicio Oral en lo Penal de Santiago',
  '2° Tribunal de Juicio Oral en lo Penal de Santiago',
  '3° Tribunal de Juicio Oral en lo Penal de Santiago',
  '4° Tribunal de Juicio Oral en lo Penal de Santiago',
  '5° Tribunal de Juicio Oral en lo Penal de Santiago',
  '6° Tribunal de Juicio Oral en lo Penal de Santiago',
  '7° Tribunal de Juicio Oral en lo Penal de Santiago',
  'Corte de Apelaciones de Santiago',

  // ── Región Metropolitana · San Miguel ──
  '1° Juzgado Civil de San Miguel',
  '2° Juzgado Civil de San Miguel',
  '3° Juzgado Civil de San Miguel',
  'Juzgado de Letras del Trabajo de San Miguel',
  'Juzgado de Familia de San Miguel',
  'Juzgado de Garantía de San Miguel',
  'Tribunal de Juicio Oral en lo Penal de San Miguel',
  'Corte de Apelaciones de San Miguel',

  // ── Región Metropolitana · Puente Alto ──
  '1° Juzgado Civil de Puente Alto',
  '2° Juzgado Civil de Puente Alto',
  'Juzgado de Letras del Trabajo de Puente Alto',
  'Juzgado de Familia de Puente Alto',
  'Juzgado de Garantía de Puente Alto',
  'Tribunal de Juicio Oral en lo Penal de Puente Alto',

  // ── Región Metropolitana · San Bernardo ──
  'Juzgado Civil de San Bernardo',
  'Juzgado de Letras del Trabajo de San Bernardo',
  'Juzgado de Familia de San Bernardo',
  'Juzgado de Garantía de San Bernardo',

  // ── XV · Arica y Parinacota ──
  'Juzgado de Letras de Arica',
  'Juzgado de Letras del Trabajo de Arica',
  'Juzgado de Familia de Arica',
  'Juzgado de Garantía de Arica',
  'Tribunal de Juicio Oral en lo Penal de Arica',
  'Corte de Apelaciones de Arica',

  // ── I · Tarapacá ──
  '1° Juzgado Civil de Iquique',
  '2° Juzgado Civil de Iquique',
  'Juzgado de Letras del Trabajo de Iquique',
  'Juzgado de Familia de Iquique',
  '1° Juzgado de Garantía de Iquique',
  '2° Juzgado de Garantía de Iquique',
  'Tribunal de Juicio Oral en lo Penal de Iquique',
  'Corte de Apelaciones de Iquique',
  'Juzgado de Letras de Alto Hospicio',

  // ── II · Antofagasta ──
  '1° Juzgado Civil de Antofagasta',
  '2° Juzgado Civil de Antofagasta',
  'Juzgado de Letras del Trabajo de Antofagasta',
  '1° Juzgado de Familia de Antofagasta',
  '2° Juzgado de Familia de Antofagasta',
  '1° Juzgado de Garantía de Antofagasta',
  '2° Juzgado de Garantía de Antofagasta',
  'Tribunal de Juicio Oral en lo Penal de Antofagasta',
  'Corte de Apelaciones de Antofagasta',
  'Juzgado de Letras de Calama',
  'Juzgado de Garantía de Calama',
  'Tribunal de Juicio Oral en lo Penal de Calama',
  'Juzgado de Letras de Tocopilla',

  // ── III · Atacama ──
  '1° Juzgado Civil de Copiapó',
  '2° Juzgado Civil de Copiapó',
  'Juzgado de Letras del Trabajo de Copiapó',
  'Juzgado de Familia de Copiapó',
  'Juzgado de Garantía de Copiapó',
  'Tribunal de Juicio Oral en lo Penal de Copiapó',
  'Corte de Apelaciones de Copiapó',
  'Juzgado de Letras de Vallenar',
  'Juzgado de Letras de Chañaral',

  // ── IV · Coquimbo ──
  '1° Juzgado Civil de La Serena',
  '2° Juzgado Civil de La Serena',
  'Juzgado de Letras del Trabajo de La Serena',
  'Juzgado de Familia de La Serena',
  '1° Juzgado de Garantía de La Serena',
  '2° Juzgado de Garantía de La Serena',
  'Tribunal de Juicio Oral en lo Penal de La Serena',
  'Corte de Apelaciones de La Serena',
  'Juzgado Civil de Coquimbo',
  'Juzgado de Garantía de Coquimbo',
  '1° Juzgado Civil de Ovalle',
  '2° Juzgado Civil de Ovalle',
  'Juzgado de Garantía de Ovalle',
  'Tribunal de Juicio Oral en lo Penal de Ovalle',
  'Juzgado de Letras de Illapel',
  'Juzgado de Letras de Vicuña',

  // ── V · Valparaíso ──
  '1° Juzgado Civil de Valparaíso',
  '2° Juzgado Civil de Valparaíso',
  '3° Juzgado Civil de Valparaíso',
  '4° Juzgado Civil de Valparaíso',
  '5° Juzgado Civil de Valparaíso',
  'Juzgado de Letras del Trabajo de Valparaíso',
  '1° Juzgado de Familia de Valparaíso',
  '2° Juzgado de Familia de Valparaíso',
  '1° Juzgado de Garantía de Valparaíso',
  '2° Juzgado de Garantía de Valparaíso',
  'Tribunal de Juicio Oral en lo Penal de Valparaíso',
  'Corte de Apelaciones de Valparaíso',
  '1° Juzgado Civil de Viña del Mar',
  '2° Juzgado Civil de Viña del Mar',
  '3° Juzgado Civil de Viña del Mar',
  'Juzgado de Letras del Trabajo de Viña del Mar',
  'Juzgado de Familia de Viña del Mar',
  'Juzgado de Garantía de Viña del Mar',
  'Tribunal de Juicio Oral en lo Penal de Viña del Mar',
  'Juzgado de Letras de San Antonio',
  'Juzgado de Garantía de San Antonio',
  'Juzgado de Letras de Quillota',
  'Juzgado de Garantía de Quillota',
  'Juzgado de Letras de Los Andes',
  'Juzgado de Garantía de Los Andes',
  'Tribunal de Juicio Oral en lo Penal de Los Andes',
  'Juzgado de Letras de San Felipe',
  'Juzgado de Garantía de San Felipe',
  'Juzgado de Letras de Casablanca',
  'Juzgado de Letras de La Ligua',
  'Juzgado de Letras de Limache',

  // ── VI · O'Higgins ──
  '1° Juzgado Civil de Rancagua',
  '2° Juzgado Civil de Rancagua',
  'Juzgado de Letras del Trabajo de Rancagua',
  'Juzgado de Familia de Rancagua',
  '1° Juzgado de Garantía de Rancagua',
  '2° Juzgado de Garantía de Rancagua',
  'Tribunal de Juicio Oral en lo Penal de Rancagua',
  'Corte de Apelaciones de Rancagua',
  'Juzgado de Letras de San Fernando',
  'Juzgado de Garantía de San Fernando',
  'Tribunal de Juicio Oral en lo Penal de San Fernando',
  'Juzgado de Letras de Pichilemu',
  'Juzgado de Letras de Graneros',

  // ── VII · Maule ──
  '1° Juzgado Civil de Talca',
  '2° Juzgado Civil de Talca',
  'Juzgado de Letras del Trabajo de Talca',
  'Juzgado de Familia de Talca',
  '1° Juzgado de Garantía de Talca',
  '2° Juzgado de Garantía de Talca',
  'Tribunal de Juicio Oral en lo Penal de Talca',
  'Corte de Apelaciones de Talca',
  '1° Juzgado Civil de Curicó',
  '2° Juzgado Civil de Curicó',
  'Juzgado de Garantía de Curicó',
  'Tribunal de Juicio Oral en lo Penal de Curicó',
  'Juzgado de Letras de Linares',
  'Juzgado de Garantía de Linares',
  'Tribunal de Juicio Oral en lo Penal de Linares',
  'Juzgado de Letras de Constitución',
  'Juzgado de Letras de Cauquenes',

  // ── XVI · Ñuble ──
  '1° Juzgado Civil de Chillán',
  '2° Juzgado Civil de Chillán',
  'Juzgado de Letras del Trabajo de Chillán',
  'Juzgado de Familia de Chillán',
  'Juzgado de Garantía de Chillán',
  'Tribunal de Juicio Oral en lo Penal de Chillán',
  'Corte de Apelaciones de Chillán',
  'Juzgado de Letras de San Carlos',
  'Juzgado de Letras de Yungay',

  // ── VIII · Biobío ──
  '1° Juzgado Civil de Concepción',
  '2° Juzgado Civil de Concepción',
  '3° Juzgado Civil de Concepción',
  '4° Juzgado Civil de Concepción',
  '1° Juzgado de Letras del Trabajo de Concepción',
  '2° Juzgado de Letras del Trabajo de Concepción',
  '1° Juzgado de Familia de Concepción',
  '2° Juzgado de Familia de Concepción',
  '1° Juzgado de Garantía de Concepción',
  '2° Juzgado de Garantía de Concepción',
  '3° Juzgado de Garantía de Concepción',
  '1° Tribunal de Juicio Oral en lo Penal de Concepción',
  '2° Tribunal de Juicio Oral en lo Penal de Concepción',
  'Corte de Apelaciones de Concepción',
  'Juzgado de Letras de Los Ángeles',
  'Juzgado de Letras del Trabajo de Los Ángeles',
  'Juzgado de Familia de Los Ángeles',
  'Juzgado de Garantía de Los Ángeles',
  'Tribunal de Juicio Oral en lo Penal de Los Ángeles',
  'Juzgado Civil de Coronel',
  'Juzgado de Garantía de Coronel',
  'Juzgado Civil de Talcahuano',
  'Juzgado de Garantía de Talcahuano',
  'Tribunal de Juicio Oral en lo Penal de Talcahuano',
  'Juzgado de Letras de Chiguayante',
  'Juzgado de Letras de Nacimiento',
  'Juzgado de Letras de Lebu',
  'Juzgado de Letras de Cañete',

  // ── IX · Araucanía ──
  '1° Juzgado Civil de Temuco',
  '2° Juzgado Civil de Temuco',
  '1° Juzgado de Letras del Trabajo de Temuco',
  '2° Juzgado de Letras del Trabajo de Temuco',
  '1° Juzgado de Familia de Temuco',
  '2° Juzgado de Familia de Temuco',
  '1° Juzgado de Garantía de Temuco',
  '2° Juzgado de Garantía de Temuco',
  '1° Tribunal de Juicio Oral en lo Penal de Temuco',
  '2° Tribunal de Juicio Oral en lo Penal de Temuco',
  'Corte de Apelaciones de Temuco',
  'Juzgado de Letras de Angol',
  'Juzgado de Garantía de Angol',
  'Tribunal de Juicio Oral en lo Penal de Angol',
  'Juzgado de Letras de Villarrica',
  'Juzgado de Garantía de Villarrica',
  'Juzgado de Letras de Victoria',
  'Juzgado de Letras de Nueva Imperial',
  'Juzgado de Letras de Traiguén',
  'Juzgado de Letras de Collipulli',

  // ── XIV · Los Ríos ──
  '1° Juzgado Civil de Valdivia',
  '2° Juzgado Civil de Valdivia',
  'Juzgado de Letras del Trabajo de Valdivia',
  'Juzgado de Familia de Valdivia',
  '1° Juzgado de Garantía de Valdivia',
  '2° Juzgado de Garantía de Valdivia',
  'Tribunal de Juicio Oral en lo Penal de Valdivia',
  'Corte de Apelaciones de Valdivia',
  'Juzgado de Letras de La Unión',
  'Juzgado de Garantía de La Unión',
  'Juzgado de Letras de Río Bueno',
  'Juzgado de Letras de Panguipulli',

  // ── X · Los Lagos ──
  '1° Juzgado Civil de Puerto Montt',
  '2° Juzgado Civil de Puerto Montt',
  'Juzgado de Letras del Trabajo de Puerto Montt',
  'Juzgado de Familia de Puerto Montt',
  '1° Juzgado de Garantía de Puerto Montt',
  '2° Juzgado de Garantía de Puerto Montt',
  'Tribunal de Juicio Oral en lo Penal de Puerto Montt',
  'Corte de Apelaciones de Puerto Montt',
  '1° Juzgado Civil de Osorno',
  '2° Juzgado Civil de Osorno',
  'Juzgado de Letras del Trabajo de Osorno',
  'Juzgado de Familia de Osorno',
  'Juzgado de Garantía de Osorno',
  'Tribunal de Juicio Oral en lo Penal de Osorno',
  'Juzgado de Letras de Castro',
  'Juzgado de Garantía de Castro',
  'Tribunal de Juicio Oral en lo Penal de Castro',
  'Juzgado de Letras de Ancud',
  'Juzgado de Letras de Puerto Varas',
  'Juzgado de Letras de Calbuco',
  'Juzgado de Letras de Llanquihue',

  // ── XI · Aysén ──
  'Juzgado de Letras de Coyhaique',
  'Juzgado de Familia de Coyhaique',
  'Juzgado de Garantía de Coyhaique',
  'Tribunal de Juicio Oral en lo Penal de Coyhaique',
  'Corte de Apelaciones de Coyhaique',
  'Juzgado de Letras de Puerto Aysén',
  'Juzgado de Letras de Chile Chico',

  // ── XII · Magallanes ──
  '1° Juzgado Civil de Punta Arenas',
  '2° Juzgado Civil de Punta Arenas',
  'Juzgado de Letras del Trabajo de Punta Arenas',
  'Juzgado de Familia de Punta Arenas',
  'Juzgado de Garantía de Punta Arenas',
  'Tribunal de Juicio Oral en lo Penal de Punta Arenas',
  'Corte de Apelaciones de Punta Arenas',
  'Juzgado de Letras de Puerto Natales',
]

/** @deprecated usar TRIBUNALES_CHILE */
export const TRIBUNALES_SANTIAGO = TRIBUNALES_CHILE
