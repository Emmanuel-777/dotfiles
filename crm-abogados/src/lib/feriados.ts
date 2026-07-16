/**
 * Feriados legales de Chile y cálculo de plazos por régimen de días.
 *
 * IMPORTANTE — verificar antes de confiar ciegamente en esta lista:
 * Estas fechas se completaron con conocimiento general (feriados fijos) y
 * fuentes públicas para los feriados de fecha variable de 2026. NO se pudo
 * verificar contra la API oficial del gobierno (apis.digital.gob.cl) por
 * restricciones de red del entorno donde se generó este archivo. Dos
 * feriados quedaron sin poder confirmarse y NO están incluidos:
 *   - Día Nacional de los Pueblos Indígenas (fecha variable, ligada al
 *     solsticio de invierno, ~20-21 de junio, Ley 21.357).
 *   - Cualquier feriado adicional ad-hoc que el Congreso agregue para 2026
 *     (ocurre casi todos los años, ej. un "feriado puente").
 * Verificar y completar esta lista contra una fuente oficial antes de
 * depender de ella para un plazo real. Actualizar cada año.
 */

export const FERIADOS_CHILE: Record<string, string> = {
  '2026-01-01': 'Año Nuevo',
  '2026-04-03': 'Viernes Santo',
  '2026-04-04': 'Sábado Santo',
  '2026-05-01': 'Día del Trabajo',
  '2026-05-21': 'Día de las Glorias Navales',
  '2026-06-29': 'San Pedro y San Pablo',
  '2026-07-16': 'Virgen del Carmen',
  '2026-08-15': 'Asunción de la Virgen',
  '2026-09-18': 'Independencia Nacional',
  '2026-09-19': 'Glorias del Ejército',
  '2026-10-12': 'Encuentro de Dos Mundos',
  '2026-10-31': 'Día de las Iglesias Evangélicas y Protestantes',
  '2026-11-01': 'Día de Todos los Santos',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
}

export function esFeriado(fechaISO: string): boolean {
  return fechaISO in FERIADOS_CHILE
}

function diaSemana(fechaISO: string): number {
  // 0 = domingo, 6 = sábado
  return new Date(fechaISO + 'T00:00:00Z').getUTCDay()
}

function sumarUnDiaISO(fechaISO: string): string {
  const d = new Date(fechaISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export type RegimenPlazo = 'HABIL_CON_SABADO' | 'HABIL_SIN_SABADO' | 'CORRIDO'

export const REGIMENES_PLAZO: { value: RegimenPlazo; label: string; detalle: string }[] = [
  {
    value: 'HABIL_CON_SABADO',
    label: 'Días hábiles (cuenta sábado)',
    detalle: 'Civil, Laboral, Familia — excluye domingo y feriados (Art. 59 CPC)',
  },
  {
    value: 'HABIL_SIN_SABADO',
    label: 'Días hábiles (no cuenta sábado)',
    detalle: 'Procedimientos administrativos — excluye sábado, domingo y feriados (Art. 25 Ley 19.880)',
  },
  {
    value: 'CORRIDO',
    label: 'Días corridos',
    detalle: 'Penal — todos los días son hábiles; si vence en feriado, se prorroga al día siguiente no feriado (Art. 14 CPP)',
  },
]

/** Sugerencia de régimen según el tipo de causa. Null = no hay regla confirmada, elegir manualmente. */
export function regimenSugerido(tipoCausa: string): RegimenPlazo | null {
  switch (tipoCausa) {
    case 'Civil':
    case 'Laboral':
    case 'Familia':
      return 'HABIL_CON_SABADO'
    case 'Penal':
      return 'CORRIDO'
    case 'Administrativo':
      return 'HABIL_SIN_SABADO'
    default:
      return null
  }
}

function esDiaHabil(fechaISO: string, regimen: RegimenPlazo): boolean {
  const dow = diaSemana(fechaISO)
  if (esFeriado(fechaISO)) return false
  if (regimen === 'HABIL_SIN_SABADO' && (dow === 0 || dow === 6)) return false
  if (regimen === 'HABIL_CON_SABADO' && dow === 0) return false
  return true
}

/**
 * Calcula la fecha de vencimiento de un plazo de `dias` contado desde
 * `fechaInicioISO` (YYYY-MM-DD), según el régimen indicado.
 */
export function calcularFechaPlazo(fechaInicioISO: string, dias: number, regimen: RegimenPlazo): string {
  if (regimen === 'CORRIDO') {
    let fecha = fechaInicioISO
    for (let i = 0; i < dias; i++) fecha = sumarUnDiaISO(fecha)
    // Art. 14 CPP: si el plazo vence en feriado, se prorroga hasta el día siguiente no feriado
    while (esFeriado(fecha)) fecha = sumarUnDiaISO(fecha)
    return fecha
  }

  let fecha = fechaInicioISO
  let contados = 0
  while (contados < dias) {
    fecha = sumarUnDiaISO(fecha)
    if (esDiaHabil(fecha, regimen)) contados++
  }
  return fecha
}
