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
  Scale,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserButton, useUser, SignOutButton } from '@clerk/nextjs'

export interface SidebarAlertas {
  agenda: { vencidos: number; criticos: number }
  tareas: { vencidos: number; criticos: number }
  citas: { hoy: number }
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/embudo', label: 'Embudo', icon: TrendingUp },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/causas', label: 'Causas', icon: Briefcase },
  { href: '/tareas', label: 'Tareas', icon: ListTodo, alertKey: 'tareas' as const },
  { href: '/citas', label: 'Citas', icon: CalendarDays, alertKey: 'citas' as const },
  { href: '/agenda', label: 'Agenda y Plazos', icon: Calendar, alertKey: 'agenda' as const },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/honorarios', label: 'Honorarios', icon: DollarSign },
]

function AlertBadge({ alertKey, alertas }: { alertKey: 'agenda' | 'tareas' | 'citas'; alertas: SidebarAlertas }) {
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

export default function Sidebar({ alertas }: { alertas: SidebarAlertas }) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col fixed left-0 top-0 z-30 print:hidden">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">LexCRM</span>
            <p className="text-slate-400 text-xs">Gestión Legal</p>
          </div>
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
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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

      {/* Footer — usuario */}
      <div className="px-4 py-4 border-t border-slate-700 space-y-3">
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
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
}
