import { AIProvider, AICompletionParams, AIError } from './provider'

const API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-6'

/**
 * Implementación de AIProvider sobre la Messages API de Anthropic.
 * Requiere la variable de entorno ANTHROPIC_API_KEY.
 * El modelo se puede configurar con AI_MODEL (default: claude-sonnet-4-6).
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private readonly apiKey: string | undefined
  private readonly model: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY
    this.model = process.env.AI_MODEL || DEFAULT_MODEL
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  async complete({ system, prompt, maxTokens = 1500, temperature = 0.4 }: AICompletionParams): Promise<string> {
    if (!this.apiKey) {
      throw new AIError('La IA no está configurada. Falta la variable ANTHROPIC_API_KEY.', 503)
    }

    let res: Response
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
    } catch {
      throw new AIError('No se pudo conectar con el servicio de IA.', 502)
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      if (res.status === 401) throw new AIError('La API key de IA es inválida.', 502)
      if (res.status === 429) throw new AIError('Límite de uso de IA alcanzado. Intenta más tarde.', 429)
      throw new AIError(`Error del servicio de IA (${res.status}). ${detail.slice(0, 200)}`, 502)
    }

    const data = await res.json()
    const text = Array.isArray(data?.content)
      ? data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim()
      : ''
    if (!text) throw new AIError('La IA no devolvió contenido.', 502)
    return text
  }
}
