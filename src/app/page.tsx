import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

export default async function Home() {
  try {
    const session = await getServerSession(authOptions)
    if (session) {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Session check failed:', error)
  }

  redirect('/login')
}
