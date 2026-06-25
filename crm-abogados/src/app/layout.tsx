import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LexCRM - Gestión Legal para Abogados',
  description: 'Sistema de gestión de causas, clientes y honorarios para abogados en Chile',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
