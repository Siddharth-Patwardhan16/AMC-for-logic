import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { MinimalSidebar } from '@/components/layout/minimal-sidebar'
import { TopBar } from '@/components/layout/top-bar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <MinimalSidebar />
      <div className="lg:ml-[200px]">
        <TopBar user={session.user} />
        <main className="pt-14">
          {children}
        </main>
      </div>
    </div>
  )
}
