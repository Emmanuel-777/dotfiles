'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ListTodo,
  Calendar,
  CalendarDays,
  FileText,
  DollarSign,
  TrendingUp,
  ChevronRight,
  LogOut,
  LifeBuoy,
  MessageCircle,
  Mail,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import LogoMark from '@/components/LogoMark'
import { UserButton, useUser, SignOutButton } from '@clerk/nextjs'

export interface SidebarAlertas {
  agenda: { vencidos: number; criticos: number }
  tareas: { vencidos: number; criticos: number }
  citas: { hoy: number }
  embudo: { vencidos: number; criticos: number }
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/embudo', label: 'Embudo', icon: TrendingUp, alertKey: 'embudo' as const },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/causas', label: 'Causas', icon: Briefcase },
  { href: '/tareas', label: 'Tareas', icon: ListTodo, alertKey: 'tareas' as const },
  { href: '/citas', label: 'Citas', icon: CalendarDays, alertKey: 'citas' as const },
  { href: '/agenda', label: 'Agenda y Plazos', icon: Calendar, alertKey: 'agenda' as const },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/honorarios', label: 'Honorarios', icon: DollarSign },
]

function AlertBadge({ alertKey, alertas }: { alertKey: 'agenda' | 'tareas' | 'citas' | 'embudo'; alertas: SidebarAlertas }) {
  if (alertKey === 'citas') {
    const hoy = alertas.citas.hoy
    if (hoy <= 0) return null
    return (
      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[11px] font-bold text-white">
        {hoy}
      </span>
    )
  }

  const { vencidos, criticos } = alertas[alertKey]
  if (vencidos > 0) {
    return (
      <span
        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white"
        title={`${vencidos} vencido(s)`}
      >
        {vencidos}
      </span>
    )
  }
  if (criticos > 0) {
    return (
      <span
        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950"
        title={`${criticos} por vencer`}
      >
        {criticos}
      </span>
    )
  }
  return null
}

export default function Sidebar({
  alertas,
  isOpen = false,
  onClose,
}: {
  alertas: SidebarAlertas
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <aside
      className="w-64 min-h-screen flex flex-col fixed left-0 top-0 z-30 print:hidden bg-gradient-to-b from-navy-800 to-navy-900 transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0"
      style={isOpen ? { transform: 'translateX(0)' } : undefined}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/95 p-1.5 shadow-sm flex-shrink-0">
            <LogoMark className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-lg tracking-tight">
              <span className="text-white">Lex</span>
              <span className="text-blue-400">CRM</span>
            </span>
            <p className="text-slate-400 text-xs">Gestión Legal</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.alertKey ? (
                <AlertBadge alertKey={item.alertKey} alertas={alertas} />
              ) : (
                isActive && <ChevronRight className="h-3 w-3 opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Ayuda técnica */}
      <div className="px-3 pb-2 border-t border-white/10 pt-3">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Soporte</p>
        <a
          href="https://wa.me/56979710838?text=Hola%2C%20necesito%20ayuda%20con%20LexCRM"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0 text-green-400" />
          <span>WhatsApp</span>
        </a>
        <a
          href="mailto:emaferna.contacto@gmail.com?subject=Ayuda%20LexCRM"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span>Correo electrónico</span>
        </a>
      </div>

      {/* Footer — usuario */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? 'Usuario'}
            </p>
            <p className="text-slate-400 text-xs truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
        <SignOutButton redirectUrl="/sign-in">
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all">
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
}
