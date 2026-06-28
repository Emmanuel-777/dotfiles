import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { esES } from '@clerk/localizations'
import './globals.css'

export const metadata: Metadata = {
  title: 'LexCRM - Gestión Legal para Abogados',
  description: 'Sistema de gestión de causas, clientes y honorarios para abogados en Chile',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{ variables: { colorPrimary: '#2563eb' } }}
    >
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
