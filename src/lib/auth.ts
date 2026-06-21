import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth-options'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function getCurrentCompany() {
  const cookieStore = await cookies()
  const companyId = cookieStore.get('selectedCompanyId')?.value
  return companyId
}
