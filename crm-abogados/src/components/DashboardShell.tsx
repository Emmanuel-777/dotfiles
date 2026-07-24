'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Toaster } from 'sonner'
import Sidebar, { type SidebarAlertas } from '@/components/Sidebar'
import GlobalSearch from '@/components/GlobalSearch'

export default function DashboardShell({
  children,
  alertas,
  perfilCompleto = true,
  esAdmin = false,
}: {
  children: React.ReactNode
  alertas: SidebarAlertas
  perfilCompleto?: boolean
  esAdmin?: boolean
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Backdrop — solo en móvil cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        alertas={alertas}
        perfilCompleto={perfilCompleto}
        esAdmin={esAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-64 min-h-screen print:ml-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/80 px-4 lg:px-8 py-3 backdrop-blur print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <GlobalSearch />
        </header>
        {children}
      </main>

      <Toaster richColors position="top-right" closeButton />
    </div>
  )
}
