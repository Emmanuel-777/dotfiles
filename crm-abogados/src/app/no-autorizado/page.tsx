'use client'

import { SignOutButton } from '@clerk/nextjs'
import LogoMark from '@/components/LogoMark'

export default function NoAutorizadoPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          <LogoMark className="h-16 w-16 opacity-40" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Acceso no autorizado
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Tu cuenta no tiene permiso para acceder a LexCRM.
          Contacta al administrador si crees que es un error.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}
