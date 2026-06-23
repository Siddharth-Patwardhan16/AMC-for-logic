'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) { setError('Invalid email or password'); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      <FadeIn className="w-full max-w-[380px]">
        <div className="flex items-center justify-center mb-10">
          <div className="h-10 w-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center mr-3">
            <div className="h-4 w-4 rounded-sm bg-[#4F8CFF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AMC</h1>
            <p className="text-xs text-[#52525B]">IT Service Management</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626]">
          <p className="text-sm text-[#A1A1AA] mb-6">Sign in to your account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 text-[#EF4444] text-xs animate-in">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs text-[#A1A1AA] mb-1.5 block">Email</label>
              <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-[#A1A1AA] mb-1.5 block">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-10 rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <div className="mt-5 p-3 rounded-xl bg-[#171717]/50 text-[11px] text-[#52525B]">
            <p className="text-[#A1A1AA] mb-1 font-medium">Demo Credentials</p>
            <p>admin@example.com / admin123</p>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
