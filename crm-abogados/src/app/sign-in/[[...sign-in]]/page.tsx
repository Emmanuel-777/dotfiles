import { SignIn } from '@clerk/nextjs'
import LogoMark from '@/components/LogoMark'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <LogoMark className="h-20 w-20" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            <span className="text-slate-700">Lex</span>
            <span className="text-blue-600">CRM</span>
          </h1>
          <p className="text-slate-500 mt-1">Gestión legal para abogados</p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
