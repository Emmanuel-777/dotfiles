import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { getUserId } from '@/lib/auth'
import { getAIProvider, AIError } from '@/lib/ai'
import { EXTRAER_SYSTEM, extraerPrompt, EXTRAER_CLIENTE_SYSTEM, extraerClientePrompt, parseExtraccion } from '@/lib/ai/prompts'
import { getPlan } from '@/lib/plan'
import { TIPOS_CAUSA } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Límite propio de este endpoint: el cuerpo viaja por una función serverless
// (tope ~4,5 MB), así que restringimos el archivo a 4 MB. Un documento judicial
// típico (demanda/resolución de pocas páginas) está muy por debajo.
const MAX_BYTES = 4 * 1024 * 1024
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
// PDF/imágenes: la IA los lee de forma nativa. .docx: extraemos el texto y se lo pasamos.
const TIPOS_OK = ['application/pdf', 'image/jpeg', 'image/png', DOCX_MIME]

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const plan = await getPlan()
  if (plan !== 'pro') {
    return NextResponse.json({ error: 'La lectura de documentos con IA es parte del plan Pro.' }, { status: 403 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
  }
  if (!TIPOS_OK.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado. Usa PDF, imagen (JPG/PNG) o Word (.docx).' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera 4 MB para lectura con IA.' }, { status: 400 })
  }

  // Qué se está extrayendo: datos de una causa (default) o de un cliente.
  const esCliente = formData?.get('tipo') === 'cliente'
  const system = esCliente ? EXTRAER_CLIENTE_SYSTEM : EXTRAER_SYSTEM
  const prompt = (docTexto?: string) =>
    esCliente ? extraerClientePrompt(docTexto) : extraerPrompt(TIPOS_CAUSA, docTexto)

  const buf = Buffer.from(await file.arrayBuffer())

  try {
    let texto: string
    if (file.type === DOCX_MIME) {
      // Word .docx: extraemos el texto plano y se lo pasamos a la IA como texto.
      const { value: docTexto } = await mammoth.extractRawText({ buffer: buf })
      if (!docTexto || !docTexto.trim()) {
        return NextResponse.json({ error: 'El documento Word no contiene texto legible.' }, { status: 400 })
      }
      texto = await getAIProvider().complete({
        system,
        prompt: prompt(docTexto),
        maxTokens: 1024,
        temperature: 0,
      })
    } else {
      // PDF / imagen: la IA lee el archivo de forma nativa.
      const kind = file.type === 'application/pdf' ? 'document' : 'image'
      texto = await getAIProvider().complete({
        system,
        prompt: prompt(),
        maxTokens: 1024,
        temperature: 0,
        attachments: [{ kind, mediaType: file.type, dataBase64: buf.toString('base64') }],
      })
    }
    const campos = parseExtraccion(texto)
    return NextResponse.json({ campos })
  } catch (e) {
    if (e instanceof AIError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'No se pudo leer el documento con IA' }, { status: 500 })
  }
}
