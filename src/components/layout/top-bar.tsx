'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Bell, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { CompanySelector } from '@/components/company/company-selector'

export function TopBar({ user }: { user: any }) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-[220px] z-30 h-14 flex items-center justify-between px-5 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#262626]">
        {/* Search */}
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#111111] border border-[#262626] hover:border-[#333333] text-[#A1A1AA] text-sm transition-all w-[280px] lg:w-[360px]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search customers...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#171717] text-[#A1A1AA] text-[10px] font-mono">/</kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <CompanySelector className="hidden sm:block" />

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white h-8 px-3 text-sm font-medium"
            onClick={() => router.push('/customers/new')}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New
          </Button>

          <button className="relative p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#171717]/50 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#4F8CFF]" />
          </button>

          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-[#262626]">
            <div className="h-7 w-7 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-[#A1A1AA]" />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-white">{user?.name || user?.email}</p>
              <p className="text-[10px] text-[#A1A1AA] capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#171717]/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-in"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-[560px] mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search customer name or GST..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#111111] border border-[#262626] text-white text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#4F8CFF]/30 focus:ring-1 focus:ring-[#4F8CFF]/10"
                    autoComplete="off"
                  />
                </div>
              </form>
              <div className="mt-3 p-4 rounded-2xl bg-[#111111] border border-[#262626]">
                <p className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium mb-3">Quick actions</p>
                <div className="space-y-1">
                  {[
                    { label: 'New Customer', shortcut: 'C', action: () => router.push('/customers/new') },
                    { label: 'New Invoice', shortcut: 'I', action: () => router.push('/invoices/new') },
                    { label: 'New Ticket', shortcut: 'T', action: () => router.push('/tickets/new') },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setSearchOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#171717] text-sm text-[#A1A1AA] hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#171717] text-[#A1A1AA] text-[10px] font-mono">{item.shortcut}</kbd>
                    </button>
                  ))}
                </div>
              </div>
          </div>
        </div>
      )}
    </>
  )
}
