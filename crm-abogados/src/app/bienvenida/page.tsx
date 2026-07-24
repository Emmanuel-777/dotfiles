import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import BienvenidaForm from './BienvenidaForm'

export const dynamic = 'force-dynamic'

export default async function BienvenidaPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-[#14254c] to-[#1a3060] px-8 py-7">
          <span className="text-2xl font-extrabold text-white">Lex<span className="text-blue-400">CRM</span></span>
          <p className="mt-2 text-sm text-slate-300">Tu prueba gratuita de 7 días · Plan Pro completo</p>
        </div>
        <div className="px-8 py-7">
          <h1 className="text-lg font-bold text-gray-900 mb-1">¡Bienvenido/a!</h1>
          <p className="text-sm text-gray-500 mb-5">
            Completa estos datos y entra al instante a probar LexCRM con todas las funciones,
            incluida la inteligencia artificial.
          </p>
          <BienvenidaForm />
        </div>
      </div>
    </div>
  )
}
