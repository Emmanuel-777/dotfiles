import Sidebar from '@/components/Sidebar'
import { initDB } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    await initDB()
  } catch (e) {
    console.error('[initDB] Error:', e)
    throw e
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen print:ml-0">
        {children}
      </main>
    </div>
  )
}
