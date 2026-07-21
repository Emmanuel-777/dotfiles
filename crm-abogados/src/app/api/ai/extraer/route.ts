import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getAIProvider, AIError } from '@/lib/ai'
import { EXTRAER_SYSTEM, extraerPrompt, parseExtraccion } from '@/lib/ai/prompts'
import { getPlan } from '@/lib/plan'
import { TIPOS_CAUSA } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Límite propio de este endpoint: el cuerpo viaja por una función serverless
// (tope ~4,5 MB), así que restringimos el archivo a 4 MB. Un documento judicial
// típico (demanda/resolución de pocas páginas) está muy por debajo.
const MAX_BYTES = 4 * 1024 * 1024
const TIPOS_OK = ['application/pdf', 'image/jpeg', 'image/png']

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
    return NextResponse.json({ error: 'Formato no soportado. Usa PDF, JPG o PNG.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera 4 MB para lectura con IA.' }, { status: 400 })
  }

  const dataBase64 = Buffer.from(await file.arrayBuffer()).toString('base64')
  const kind = file.type === 'application/pdf' ? 'document' : 'image'

  try {
    const texto = await getAIProvider().complete({
      system: EXTRAER_SYSTEM,
      prompt: extraerPrompt(TIPOS_CAUSA),
      maxTokens: 1024,
      temperature: 0,
      attachments: [{ kind, mediaType: file.type, dataBase64 }],
    })
    const campos = parseExtraccion(texto)
    return NextResponse.json({ campos })
  } catch (e) {
    if (e instanceof AIError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'No se pudo leer el documento con IA' }, { status: 500 })
  }
}
