import { AIProvider } from './provider'
import { AnthropicProvider } from './anthropic'

let cached: AIProvider | null = null

/**
 * Factory del proveedor de IA activo.
 * Cambiar de motor es tan simple como devolver otra implementación aquí
 * (p.ej. según process.env.AI_PROVIDER).
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached
  cached = new AnthropicProvider()
  return cached
}

export { AIError } from './provider'
export type { AIProvider, AICompletionParams } from './provider'
