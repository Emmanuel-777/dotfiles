import Link from 'next/link'
import { Plus, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  /** Variante compacta para usar dentro de widgets/listas pequeñas */
  compact?: boolean
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div className={`mx-auto mb-3 flex items-center justify-center rounded-2xl bg-gray-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}>
        <Icon className={`text-gray-300 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`} />
      </div>
      <p className={`font-semibold text-gray-700 ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      {description && (
        <p className={`mx-auto mt-1 max-w-sm text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-4 inline-flex w-auto">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
