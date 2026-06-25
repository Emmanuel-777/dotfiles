'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Mail, CheckCircle2 } from 'lucide-react'

function formatPhone(celular: string): string {
  const digits = celular.replace(/\D/g, '')
  if (digits.startsWith('56')) return digits
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`
  if (digits.length === 8) return `569${digits}`
  return digits
}

export default function ReminderButtons({
  actuacionId,
  compromiso,
  fechaRecordatorio,
  recordatorioEnviado,
  clienteNombre,
  clienteCelular,
  clienteEmail,
  causaRol,
  abogado,
}: {
  actuacionId: string
  compromiso: string
  fechaRecordatorio: string | null
  recordatorioEnviado: number
  clienteNombre: string
  clienteCelular: string | null
  clienteEmail: string | null
  causaRol: string
  abogado: string | null
}) {
  const router = useRouter()
  const [enviado, setEnviado] = useState(recordatorioEnviado === 1)
  const [marking, setMarking] = useState(false)

  const fechaTexto = fechaRecordatorio
    ? new Date(fechaRecordatorio + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const mensaje = [
    `Estimado/a ${clienteNombre},`,
    ``,
    `Le escribimos en relación a la causa ROL ${causaRol} para recordarle el siguiente compromiso acordado:`,
    ``,
    `📌 ${compromiso}`,
    fechaTexto ? `📅 Fecha límite: ${fechaTexto}` : '',
    ``,
    `Quedamos a su disposición para cualquier consulta.`,
    abogado ? `\nSaludos,\n${abogado}` : '',
  ].filter((l) => l !== undefined).join('\n').trim()

  const waUrl = clienteCelular
    ? `https://wa.me/${formatPhone(clienteCelular)}?text=${encodeURIComponent(mensaje)}`
    : null

  const mailUrl = clienteEmail
    ? `mailto:${clienteEmail}?subject=${encodeURIComponent(`Recordatorio causa ${causaRol}`)}&body=${encodeURIComponent(mensaje)}`
    : null

  const marcarEnviado = async () => {
    setMarking(true)
    await fetch(`/api/actuaciones/${actuacionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordatorioEnviado: 1 }),
    })
    setEnviado(true)
    setMarking(false)
    router.refresh()
  }

  if (enviado) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Recordatorio enviado
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-1">
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setTimeout(marcarEnviado, 1500)}
          className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded-full transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          WhatsApp
        </a>
      )}
      {mailUrl && (
        <a
          href={mailUrl}
          onClick={() => setTimeout(marcarEnviado, 1500)}
          className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-full transition-colors"
        >
          <Mail className="h-3 w-3" />
          Email
        </a>
      )}
      <button
        onClick={marcarEnviado}
        disabled={marking}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Marcar como enviado
      </button>
    </div>
  )
}
