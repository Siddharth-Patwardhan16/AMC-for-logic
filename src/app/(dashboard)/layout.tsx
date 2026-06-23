import { redirect, unstable_rethrow } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { DashboardProviders } from '@/components/dashboard-providers'
import { MinimalSidebar } from '@/components/layout/minimal-sidebar'
import { TopBar } from '@/components/layout/top-bar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    unstable_rethrow(error)
    console.error('Dashboard session error:', error)
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardProviders>
      <div className="min-h-screen bg-[#0A0A0A]">
        <MinimalSidebar />
        <div className="lg:ml-[200px]">
          <TopBar user={session.user} />
          <main className="pt-14">
            {children}
          </main>
        </div>
      </div>
    </DashboardProviders>
  )
}
