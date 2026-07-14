import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { esES } from '@clerk/localizations'
import PwaRegister from '@/components/PwaRegister'
import './globals.css'

export const metadata: Metadata = {
  title: 'LexCRM - Gestión Legal para Abogados',
  description: 'Sistema de gestión de causas, clientes y honorarios para abogados en Chile',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LexCRM',
  },
}

export const viewport: Viewport = {
  themeColor: '#14254c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{ variables: { colorPrimary: '#2563eb' } }}
    >
      <html lang="es">
        <body>
          <PwaRegister />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
