/**
 * Abstracción de proveedor de IA.
 * Permite intercambiar el motor (Anthropic, OpenAI, etc.) sin tocar
 * las rutas ni la UI. Para agregar un proveedor nuevo basta con
 * implementar esta interfaz y registrarlo en `getAIProvider()`.
 */

/** Adjunto (PDF o imagen) que la IA lee de forma nativa junto al prompt. */
export interface AIAttachment {
  /** 'document' para PDF, 'image' para JPG/PNG */
  kind: 'document' | 'image'
  /** MIME real: application/pdf, image/jpeg, image/png */
  mediaType: string
  /** Contenido del archivo en base64 (sin encabezado data:) */
  dataBase64: string
}

export interface AICompletionParams {
  /** Instrucciones de sistema (rol, tono, restricciones) */
  system: string
  /** Mensaje del usuario / contexto de la tarea */
  prompt: string
  /** Límite de tokens de salida (default según proveedor) */
  maxTokens?: number
  /** Creatividad 0–1 (default según proveedor) */
  temperature?: number
  /** Documentos/imágenes que la IA debe leer junto al prompt (solo `complete`) */
  attachments?: AIAttachment[]
}

export interface AIProvider {
  /** Identificador legible del proveedor, p.ej. "anthropic" */
  readonly name: string
  /** true si hay credenciales/config suficientes para operar */
  isConfigured(): boolean
  /** Genera una respuesta de texto a partir de los parámetros */
  complete(params: AICompletionParams): Promise<string>
  /**
   * Igual que complete() pero entrega el texto en streaming (token a token).
   * Los errores previos al stream (config, credenciales, límite) se lanzan
   * como AIError antes de devolver el stream, para poder mapearlos a HTTP.
   */
  stream(params: AICompletionParams): Promise<ReadableStream<Uint8Array>>
}

/** Error de dominio para fallos controlados de IA (se mapea a HTTP) */
export class AIError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message)
    this.name = 'AIError'
  }
}
