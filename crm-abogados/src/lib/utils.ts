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

export const TRIBUNALES_SANTIAGO = [
  '1° Juzgado Civil de Santiago',
  '2° Juzgado Civil de Santiago',
  '3° Juzgado Civil de Santiago',
  '4° Juzgado Civil de Santiago',
  '15° Juzgado Civil de Santiago',
  '1° Juzgado de Letras del Trabajo de Santiago',
  '2° Juzgado de Letras del Trabajo de Santiago',
  '3° Juzgado de Letras del Trabajo de Santiago',
  'Juzgado de Familia de Santiago',
  '1° Juzgado de Garantía de Santiago',
  '7° Juzgado de Garantía de Santiago',
  'Corte de Apelaciones de Santiago',
  'Corte Suprema',
]
