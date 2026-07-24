import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getAIProvider, AIError } from '@/lib/ai'
import { loadCausaContext } from '@/lib/ai/causa-context'
import { RESUMEN_SYSTEM, resumenPrompt } from '@/lib/ai/prompts'
import { getPlan, esCuentaTrial } from '@/lib/plan'
import { chequearYRegistrarIA } from '@/lib/usoIa'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const plan = await getPlan()
  if (plan !== 'pro') {
    return NextResponse.json({ error: 'El Asistente IA no está incluido en tu plan actual.' }, { status: 403 })
  }

  const { permitido, limite } = await chequearYRegistrarIA(userId, await esCuentaTrial())
  if (!permitido) {
    return NextResponse.json({ error: `Alcanzaste el límite diario de IA de la prueba (${limite} usos). Vuelve mañana o suscríbete para uso sin límite.` }, { status: 429 })
  }

  const { causaId } = await req.json().catch(() => ({}))
  if (!causaId) return NextResponse.json({ error: 'Falta causaId' }, { status: 400 })

  const contexto = await loadCausaContext(causaId, userId)
  if (!contexto) return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 })

  try {
    const stream = await getAIProvider().stream({
      system: RESUMEN_SYSTEM,
      prompt: resumenPrompt(contexto),
      maxTokens: 1200,
    })
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    if (e instanceof AIError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Error inesperado al generar el resumen' }, { status: 500 })
  }
}
