/**
 * Abstracción de proveedor de IA.
 * Permite intercambiar el motor (Anthropic, OpenAI, etc.) sin tocar
 * las rutas ni la UI. Para agregar un proveedor nuevo basta con
 * implementar esta interfaz y registrarlo en `getAIProvider()`.
 */

export interface AICompletionParams {
  /** Instrucciones de sistema (rol, tono, restricciones) */
  system: string
  /** Mensaje del usuario / contexto de la tarea */
  prompt: string
  /** Límite de tokens de salida (default según proveedor) */
  maxTokens?: number
  /** Creatividad 0–1 (default según proveedor) */
  temperature?: number
}

export interface AIProvider {
  /** Identificador legible del proveedor, p.ej. "anthropic" */
  readonly name: string
  /** true si hay credenciales/config suficientes para operar */
  isConfigured(): boolean
  /** Genera una respuesta de texto a partir de los parámetros */
  complete(params: AICompletionParams): Promise<string>
}

/** Error de dominio para fallos controlados de IA (se mapea a HTTP) */
export class AIError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message)
    this.name = 'AIError'
  }
}
