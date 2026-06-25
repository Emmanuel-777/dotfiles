import Sidebar from '@/components/Sidebar'
import { initDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
