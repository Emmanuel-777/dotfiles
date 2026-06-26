/**
 * Isotipo de LexCRM: escudo con red de nodos y flecha ascendente.
 * SVG vectorial — escala nítido en cualquier tamaño y hereda el degradé de marca.
 */
export default function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="LexCRM" fill="none">
      <defs>
        <linearGradient id="lexcrm-grad" x1="12" y1="92" x2="88" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14254c" />
          <stop offset="0.55" stopColor="#1c47b8" />
          <stop offset="1" stopColor="#3b7bf0" />
        </linearGradient>
      </defs>

      {/* Escudo */}
      <path
        d="M26 20 H74 Q80 20 80 26 V54 Q80 76 50 90 Q20 76 20 54 V26 Q20 20 26 20 Z"
        stroke="url(#lexcrm-grad)"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Red de nodos */}
      <g stroke="url(#lexcrm-grad)" strokeWidth="3.4" strokeLinecap="round">
        <path d="M50 32 V48" />
        <path d="M50 53 L39 62" />
        <path d="M39 65 L32 73" />
        <path d="M51 54 L62 70" />
        {/* Flecha ascendente */}
        <path d="M52 51 L70 39" />
        <path d="M70 39 L61 39" />
        <path d="M70 39 L70 48" />
      </g>

      {/* Nodos */}
      <g fill="url(#lexcrm-grad)">
        <circle cx="50" cy="28" r="5" />
        <circle cx="50" cy="51" r="4" />
        <circle cx="39" cy="63" r="4" />
        <circle cx="31" cy="74" r="4" />
        <circle cx="63" cy="71" r="4.5" />
      </g>
    </svg>
  )
}
