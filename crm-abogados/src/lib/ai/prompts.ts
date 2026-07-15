import type { Causa, Cliente, Actuacion, Plazo, Tarea } from '@/lib/schema'
import { formatFechaCorta, formatFechaHoraChile } from '@/lib/utils'

interface CausaContextData {
  causa: Causa
  cliente: Cliente | null
  actuaciones: Actuacion[]
  plazos: Plazo[]
  tareas: Tarea[]
}

/** Arma un contexto textual compacto de la causa para alimentar a la IA. */
export function buildCausaContext({ causa, cliente, actuaciones, plazos, tareas }: CausaContextData): string {
  const lineas: string[] = []
  lineas.push(`ROL: ${causa.rol}`)
  lineas.push(`Tribunal: ${causa.tribunal}`)
  lineas.push(`Tipo / materia: ${causa.tipoCausa}${causa.materia ? ` — ${causa.materia}` : ''}`)
  lineas.push(`Estado: ${causa.estado}`)
  lineas.push(`Fecha de ingreso: ${formatFechaCorta(causa.fechaIngreso)}`)
  if (cliente) lineas.push(`Cliente representado: ${cliente.nombre}${cliente.rut ? ` (RUT ${cliente.rut})` : ''}`)
  if (causa.contraparte) lineas.push(`Contraparte: ${causa.contraparte}`)
  if (causa.abogadoResponsable) lineas.push(`Abogado responsable: ${causa.abogadoResponsable}`)
  if (causa.descripcion) lineas.push(`Descripción: ${causa.descripcion}`)

  if (actuaciones.length) {
    lineas.push('\nACTUACIONES (más recientes primero):')
    for (const a of actuaciones.slice(0, 20)) {
      lineas.push(`- ${formatFechaCorta(a.fecha)} [${a.tipo}] ${a.descripcion}${a.resultado ? ` → ${a.resultado}` : ''}`)
    }
  }

  const plazosPend = plazos.filter((p) => p.estado === 'PENDIENTE')
  if (plazosPend.length) {
    lineas.push('\nPLAZOS Y AUDIENCIAS PENDIENTES:')
    for (const p of plazosPend) {
      lineas.push(`- ${formatFechaCorta(p.fecha)} [${p.tipo}] ${p.titulo}`)
    }
  }

  const tareasAct = tareas.filter((t) => !['COMPLETADA', 'CANCELADA'].includes(t.estado))
  if (tareasAct.length) {
    lineas.push('\nTAREAS ACTIVAS:')
    for (const t of tareasAct) {
      lineas.push(`- [${t.prioridad}] ${t.titulo}${t.fechaVencimiento ? ` (vence ${formatFechaHoraChile(t.fechaVencimiento)})` : ''}`)
    }
  }

  return lineas.join('\n')
}

export const RESUMEN_SYSTEM = `Eres un asistente jurídico para abogados litigantes en Chile.
Tu tarea es redactar resúmenes ejecutivos del estado de una causa judicial, en español de Chile,
con terminología procesal chilena correcta. Sé claro, conciso y profesional.
Estructura la respuesta en estas secciones con encabezados:
1. Estado actual de la causa
2. Últimas actuaciones relevantes
3. Próximos hitos y plazos
4. Acciones recomendadas
No inventes hechos que no estén en el contexto. Si falta información, indícalo.`

export function resumenPrompt(contexto: string): string {
  return `Redacta un resumen ejecutivo del estado de la siguiente causa, listo para compartir con el cliente o el equipo:\n\n${contexto}`
}

export const BORRADOR_SYSTEM = `Eres un abogado redactor experto en escritos judiciales conforme al derecho procesal chileno.
Redactas borradores de escritos en español formal de Chile, con la estructura habitual:
suma, encabezado dirigido a S.S. (Su Señoría), individualización de las partes, cuerpo con fundamentos
de hecho y de derecho, peticiones concretas (POR TANTO / RUEGO A US.), y otrosíes si corresponde.
El resultado es un BORRADOR de apoyo: debe ser revisado por un abogado antes de presentarse.
No inventes citas legales específicas (artículos, fechas, montos) si no constan en el contexto;
usa marcadores como [CITAR NORMA] o [COMPLETAR] cuando falte el dato.`

export function borradorPrompt(contexto: string, tipo: string, instrucciones: string): string {
  return `Redacta el borrador de un escrito del tipo: "${tipo}".

${instrucciones ? `Instrucciones específicas del abogado:\n${instrucciones}\n\n` : ''}Contexto de la causa:
${contexto}`
}

export const TIPOS_ESCRITO = [
  'Escrito de téngase presente',
  'Solicitud de copias',
  'Solicitud de audiencia',
  'Contestación de demanda',
  'Demanda',
  'Recurso de reposición',
  'Recurso de apelación',
  'Cumplimiento de lo ordenado',
  'Delega poder / patrocinio y poder',
  'Solicitud de prórroga de plazo',
]
