import { Sparkles } from 'lucide-react'

// Banner de prueba. Solo se renderiza para usuarios en prueba (trialDias != null).
// Los usuarios permanentes (ALLOWED_EMAILS / plan activo) no lo ven nunca.
export default function TrialBanner({ trialDias }: { trialDias: number | null }) {
  if (trialDias === null) return null

  const texto =
    trialDias <= 0
      ? 'Tu prueba termina hoy'
      : trialDias === 1
        ? 'Te queda 1 día de prueba'
        : `Te quedan ${trialDias} días de prueba`

  const urgente = trialDias <= 2

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-sm ${
        urgente ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-800'
      }`}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Sparkles className="h-4 w-4" />
        {texto} · Plan Pro completo
      </span>
      <a
        href="https://wa.me/56979710838?text=Hola,%20quiero%20suscribirme%20a%20LexCRM"
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
          urgente ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Suscribirme
      </a>
    </div>
  )
}
