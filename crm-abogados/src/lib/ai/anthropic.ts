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

  async complete({ system, prompt, maxTokens = 1500, temperature = 0.4, attachments }: AICompletionParams): Promise<string> {
    if (!this.apiKey) {
      throw new AIError('La IA no está configurada. Falta la variable ANTHROPIC_API_KEY.', 503)
    }

    // Si hay adjuntos (PDF/imagen), el contenido es una lista de bloques con el
    // documento primero y el texto después; si no, es texto plano.
    const content = attachments && attachments.length
      ? [
          ...attachments.map((a) =>
            a.kind === 'document'
              ? { type: 'document', source: { type: 'base64', media_type: a.mediaType, data: a.dataBase64 } }
              : { type: 'image', source: { type: 'base64', media_type: a.mediaType, data: a.dataBase64 } },
          ),
          { type: 'text', text: prompt },
        ]
      : prompt

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
          messages: [{ role: 'user', content }],
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

  async stream({ system, prompt, maxTokens = 1500, temperature = 0.4 }: AICompletionParams): Promise<ReadableStream<Uint8Array>> {
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
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
    } catch {
      throw new AIError('No se pudo conectar con el servicio de IA.', 502)
    }

    // Errores antes de comenzar el stream: se mapean a HTTP en la ruta.
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '')
      if (res.status === 401) throw new AIError('La API key de IA es inválida.', 502)
      if (res.status === 429) throw new AIError('Límite de uso de IA alcanzado. Intenta más tarde.', 429)
      throw new AIError(`Error del servicio de IA (${res.status}). ${detail.slice(0, 200)}`, 502)
    }

    const upstream = res.body
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // Reempaqueta el SSE de Anthropic en un stream de texto plano (solo los deltas de texto).
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.getReader()
        let buffer = ''
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lineas = buffer.split('\n')
            buffer = lineas.pop() ?? ''
            for (const linea of lineas) {
              const t = linea.trim()
              if (!t.startsWith('data:')) continue
              const payload = t.slice(5).trim()
              if (!payload || payload === '[DONE]') continue
              try {
                const evt = JSON.parse(payload)
                if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
                  controller.enqueue(encoder.encode(evt.delta.text))
                }
              } catch {
                // línea no-JSON (ping, comentario): se ignora
              }
            }
          }
        } catch {
          // corte de conexión con el proveedor: cerramos lo generado hasta aquí
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })
  }
}
