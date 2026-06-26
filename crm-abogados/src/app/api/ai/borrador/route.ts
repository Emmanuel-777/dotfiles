import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getAIProvider, AIError } from '@/lib/ai'
import { loadCausaContext } from '@/lib/ai/causa-context'
import { BORRADOR_SYSTEM, borradorPrompt } from '@/lib/ai/prompts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { causaId, tipo, instrucciones } = await req.json().catch(() => ({}))
  if (!causaId) return NextResponse.json({ error: 'Falta causaId' }, { status: 400 })
  if (!tipo) return NextResponse.json({ error: 'Falta el tipo de escrito' }, { status: 400 })

  const contexto = await loadCausaContext(causaId, userId)
  if (!contexto) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })

  try {
    const texto = await getAIProvider().complete({
      system: BORRADOR_SYSTEM,
      prompt: borradorPrompt(contexto, tipo, instrucciones || ''),
      maxTokens: 2000,
    })
    return NextResponse.json({ texto })
  } catch (e) {
    if (e instanceof AIError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error inesperado al generar el borrador' }, { status: 500 })
  }
}
