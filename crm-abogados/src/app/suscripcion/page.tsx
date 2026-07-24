import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'

const WHATSAPP = 'https://wa.me/56979710838?text=' + encodeURIComponent('Hola, quiero suscribirme a LexCRM tras mi prueba.')

export default async function SuscripcionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden text-center">
        <div className="bg-gradient-to-br from-[#14254c] to-[#1a3060] px-8 py-7">
          <span className="text-2xl font-extrabold text-white">Lex<span className="text-blue-400">CRM</span></span>
          <p className="mt-2 text-sm text-slate-300">Tu prueba gratuita terminó</p>
        </div>
        <div className="px-8 py-8">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Gracias por probar LexCRM</h1>
          <p className="text-sm text-gray-500 mb-6">
            Tus datos están guardados y a salvo. Para seguir usando el CRM, activa tu suscripción
            y retomas justo donde lo dejaste.
          </p>

          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-[#14254c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3060] mb-3"
          >
            Quiero suscribirme
          </a>

          <p className="text-xs text-gray-400 mb-6">
            Te contactamos para coordinar la activación de tu cuenta.
          </p>

          <SignOutButton>
            <button className="text-xs text-gray-400 hover:text-gray-600 underline">
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}
