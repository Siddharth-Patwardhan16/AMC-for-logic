'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/components/providers'

export function Header({ user }: { user: any }) {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string>('')
  
  const { data: companies } = trpc.company.list.useQuery()
  
  const handleCompanyChange = (value: string) => {
    setCompanyId(value)
    document.cookie = `selectedCompanyId=${value}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Select value={companyId} onValueChange={handleCompanyChange}>
          <SelectTrigger className="w-[260px]">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push('/api/auth/signout')}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
