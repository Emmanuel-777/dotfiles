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

FORMATO: usa un formato simple y legible — encabezados cortos y listas con guiones.
No uses tablas, ni recuadros, ni exceso de negritas o símbolos.

REGLA DE TRAZABILIDAD (obligatoria): cada afirmación sobre un hecho procesal debe
respaldarse citando entre paréntesis la fecha de la actuación, plazo o audiencia que la sustenta,
usando el formato (actuación del DD-MM-AAAA), (plazo del DD-MM-AAAA) o (audiencia del DD-MM-AAAA),
tomando la fecha exacta del contexto entregado. Así el abogado puede verificar cada dato de un vistazo.
No inventes hechos, fechas ni actuaciones que no consten en el contexto: si un dato falta, dilo
explícitamente en lugar de suponerlo.`

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

// ————————————————————————————————————————————————————————————
// Extracción de datos desde un documento (demanda, resolución, escrito)
// ————————————————————————————————————————————————————————————

export const EXTRAER_SYSTEM = `Eres un asistente jurídico que lee documentos judiciales chilenos
(demandas, resoluciones, escritos, notificaciones) y extrae sus datos de identificación.
Devuelves SIEMPRE y ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin explicaciones
y sin envolverlo en bloques de código. Si un dato no aparece en el documento, usa null.
No inventes datos que no consten en el documento.`

/**
 * Construye el prompt de extracción con la lista de tipos de causa válidos.
 * Si se pasa `documentoTexto` (p. ej. extraído de un .docx), la IA lee ese
 * texto; si no, lee el documento adjunto (PDF/imagen).
 */
export function extraerPrompt(tiposCausa: readonly string[], documentoTexto?: string): string {
  const fuente = documentoTexto ? 'del documento incluido más abajo' : 'del documento adjunto'
  const cola = documentoTexto
    ? `\n\nDOCUMENTO:\n"""\n${documentoTexto.slice(0, 40000)}\n"""`
    : ''
  return `Extrae ${fuente} los siguientes campos y devuélvelos como JSON con EXACTAMENTE estas claves:

{
  "rol": "ROL o RIT de la causa (ej: C-1234-2024, RIT 567-2024), o null",
  "tribunal": "nombre completo del tribunal tal como aparece, o null",
  "tipoCausa": "uno de: ${tiposCausa.join(', ')} — el que corresponda, o null",
  "materia": "materia o naturaleza del asunto (ej: Cobro de pesos, Despido injustificado), o null",
  "contraparte": "carátula de la causa en formato 'X con Y' (ej: Pérez con García), o null",
  "abogadoResponsable": "nombre del abogado patrocinante o apoderado si aparece, o null",
  "fechaIngreso": "fecha de ingreso o de la resolución en formato AAAA-MM-DD, o null",
  "descripcion": "una frase breve (máx 200 caracteres) resumiendo de qué trata el documento, o null"
}

Reglas:
- Responde solo el JSON, nada más.
- Usa null (no cadenas vacías) para lo que no encuentres.
- Para "tipoCausa" elige exactamente uno de los valores de la lista; si no puedes determinarlo, usa null.${cola}`
}

// ————————————————————————————————————————————————————————————
// Extracción de datos de un CLIENTE desde un documento (cédula, contrato, etc.)
// ————————————————————————————————————————————————————————————

export const EXTRAER_CLIENTE_SYSTEM = `Eres un asistente que lee documentos chilenos de identificación
(cédula de identidad, RUT, tarjetas, documentos con datos personales o de una empresa) y extrae los
datos de identificación de una persona o empresa para registrarla como cliente de un estudio jurídico.
Devuelves SIEMPRE y ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin explicaciones y sin
envolverlo en bloques de código. Si un dato no aparece en el documento, usa null. No inventes datos.`

/** Prompt de extracción de un cliente; opcionalmente con el texto de un .docx. */
export function extraerClientePrompt(documentoTexto?: string): string {
  const fuente = documentoTexto ? 'del documento incluido más abajo' : 'del documento adjunto'
  const cola = documentoTexto ? `\n\nDOCUMENTO:\n"""\n${documentoTexto.slice(0, 40000)}\n"""` : ''
  return `Extrae ${fuente} los datos del cliente y devuélvelos como JSON con EXACTAMENTE estas claves:

{
  "nombre": "nombre completo de la persona o razón social de la empresa, o null",
  "rut": "RUT en formato chileno con guión y dígito verificador (ej: 12.345.678-9), o null",
  "tipo": "PERSONA_NATURAL si es una persona; PERSONA_JURIDICA si es una empresa/razón social, o null",
  "email": "correo electrónico, o null",
  "telefono": "teléfono fijo, o null",
  "celular": "teléfono celular/móvil, o null",
  "direccion": "dirección/domicilio, o null",
  "ciudad": "ciudad o comuna, o null"
}

Reglas:
- Responde solo el JSON, nada más.
- Usa null (no cadenas vacías) para lo que no encuentres.
- "tipo" debe ser exactamente PERSONA_NATURAL o PERSONA_JURIDICA; si no puedes determinarlo, usa null.${cola}`
}

/**
 * Parsea la respuesta de la IA a un objeto de campos, tolerando que venga
 * envuelta en ```json o con texto alrededor. Devuelve {} si no logra parsear.
 */
export function parseExtraccion(texto: string): Record<string, string | null> {
  const inicio = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')
  if (inicio === -1 || fin === -1 || fin < inicio) return {}
  try {
    const obj = JSON.parse(texto.slice(inicio, fin + 1))
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
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
