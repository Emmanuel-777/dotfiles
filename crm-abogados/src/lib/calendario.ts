/** Generación de eventos de calendario (ICS universal + link directo de Google Calendar) para citas. */

function formatICSDate(fecha: string, hora: string): string {
  // fecha: YYYY-MM-DD, hora: HH:mm — se asume hora de Chile, sin conversión de zona
  // (mismo criterio que el resto de fechas "naive" del sistema: lo que se ve es lo que es).
  const [h, m] = hora.split(':')
  return `${fecha.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildICS({
  titulo,
  descripcion,
  fecha,
  horaInicio,
  horaFin,
  ubicacion,
}: {
  titulo: string
  descripcion?: string
  fecha: string
  horaInicio: string
  horaFin?: string | null
  ubicacion?: string
}): string {
  const dtStart = formatICSDate(fecha, horaInicio)
  const dtEnd = formatICSDate(fecha, horaFin ?? horaInicio)
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LexCRM//Citas//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${dtStart}-${Math.random().toString(36).slice(2)}@lexcrm.site`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=America/Santiago:${dtStart}`,
    `DTEND;TZID=America/Santiago:${dtEnd}`,
    `SUMMARY:${escapeICS(titulo)}`,
    descripcion ? `DESCRIPTION:${escapeICS(descripcion)}` : '',
    ubicacion ? `LOCATION:${escapeICS(ubicacion)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export function buildGoogleCalendarLink({
  titulo,
  descripcion,
  fecha,
  horaInicio,
  horaFin,
  ubicacion,
}: {
  titulo: string
  descripcion?: string
  fecha: string
  horaInicio: string
  horaFin?: string | null
  ubicacion?: string
}): string {
  const dtStart = formatICSDate(fecha, horaInicio)
  const dtEnd = formatICSDate(fecha, horaFin ?? horaInicio)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${dtStart}/${dtEnd}`,
    ...(descripcion ? { details: descripcion } : {}),
    ...(ubicacion ? { location: ubicacion } : {}),
    ctz: 'America/Santiago',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
