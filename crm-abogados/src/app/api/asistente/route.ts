import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SYSTEM_PROMPT = `Eres el asistente virtual de LexCRM, un sistema de gestión legal para abogados en Chile.
Ayuda a los usuarios a entender y usar el sistema. Responde en español, de forma breve y práctica.

Módulos disponibles:
- Dashboard: resumen del estudio, vencimientos próximos, KPIs financieros y gráfico de honorarios
- Clientes: registro con RUT (sin puntos, con guión: 12345678-9), nombre, tipo (natural/jurídica)
- Causas: expedientes con número de rol, tribunal, tipo (Civil/Laboral/Familia/Penal/etc.), estado, fechas de vencimiento
- Honorarios: cobros en pesos chilenos con estados Emitido, Pagado o Anulado
- Agenda y Plazos: plazos procesales y vencimientos de causas
- Tareas: pendientes con fecha límite y prioridad
- Citas: reuniones y audiencias; las de hoy aparecen con badge azul en el menú
- Embudo: gestión de prospectos en tablero kanban (Contacto → Reunión → Propuesta → Ganado/Perdido), con opción de convertir a cliente
- Documentos: archivo de documentos del estudio
- Asistente IA: dentro de cada causa, genera resúmenes ejecutivos y borradores de escritos

Semáforo en el menú lateral:
- Rojo: elemento vencido (acción inmediata)
- Amarillo: vence en 3 días o menos
- Azul: citas programadas para hoy

Búsqueda global: Ctrl+K en Windows/Linux, Cmd+K en Mac — busca clientes, causas y honorarios.

Si la pregunta es sobre acceso al sistema, facturación del servicio, errores técnicos o configuración, indica que contacte al soporte en emaferna.contacto@gmail.com.`

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const messages: Mensaje[] = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return NextResponse.json({ error: 'Falta el campo messages' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'El asistente no está configurado en este momento.' }, { status: 503 })
  }

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el asistente.' }, { status: 502 })
  }

  if (!res.ok) {
    if (res.status === 429) {
      return NextResponse.json({ error: 'Límite de consultas alcanzado. Intenta en unos minutos.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Error al consultar el asistente.' }, { status: 502 })
  }

  const data = await res.json()
  const texto = Array.isArray(data?.content)
    ? data.content
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('\n')
        .trim()
    : ''

  if (!texto) return NextResponse.json({ error: 'El asistente no devolvió respuesta.' }, { status: 502 })
  return NextResponse.json({ respuesta: texto })
}
