import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getAIProvider, AIError } from '@/lib/ai'
import { loadCausaContext } from '@/lib/ai/causa-context'
import { RESUMEN_SYSTEM, resumenPrompt } from '@/lib/ai/prompts'
import { getPlan } from '@/lib/plan'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const plan = await getPlan()
  if (plan !== 'pro') {
    return NextResponse.json({ error: 'El Asistente IA no está incluido en tu plan actual.' }, { status: 403 })
  }

  const { causaId } = await req.json().catch(() => ({}))
  if (!causaId) return NextResponse.json({ error: 'Falta causaId' }, { status: 400 })

  const contexto = await loadCausaContext(causaId, userId)
  if (!contexto) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })

  try {
    const texto = await getAIProvider().complete({
      system: RESUMEN_SYSTEM,
      prompt: resumenPrompt(contexto),
      maxTokens: 1200,
    })
    return NextResponse.json({ texto })
  } catch (e) {
    if (e instanceof AIError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error inesperado al generar el resumen' }, { status: 500 })
  }
}
