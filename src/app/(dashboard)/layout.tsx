import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error('Dashboard session error:', error)
  }

  if (!session) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const selectedCompany = cookieStore.get('selectedCompanyId')?.value

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header user={session.user} />
        <main className="p-6 pt-20">
          <div className="animate-slide-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
