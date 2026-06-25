import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">LexCRM</h1>
          <p className="text-slate-500 mt-1">Crea tu cuenta</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
