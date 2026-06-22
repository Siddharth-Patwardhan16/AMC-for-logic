'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ArrowRight, Users, HardDrive, Receipt, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'

// This is a simplified search page - in production it would use a proper search endpoint
export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const quickActions = [
    { label: 'New Customer', href: '/customers/new', icon: Users, color: 'bg-[#4F8CFF]/10 text-[#4F8CFF]' },
    { label: 'New Invoice', href: '/invoices/new', icon: Receipt, color: 'bg-[#22C55E]/10 text-[#22C55E]' },
    { label: 'New Asset', href: '/assets/new', icon: HardDrive, color: 'bg-[#EAB308]/10 text-[#EAB308]' },
    { label: 'New Quotation', href: '/quotations/new', icon: FileText, color: 'bg-[#A855F7]/10 text-[#A855F7]' },
  ]

  return (
    <div className="p-5 lg:p-8 max-w-[800px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-6">Search</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
            <Input
              placeholder="Search customers, assets, invoices, tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
              autoFocus
            />
          </div>
        </form>

        {query && (
          <div className="mb-8">
            <p className="text-sm text-[#A1A1AA] mb-4">Results for "{query}"</p>
            <div className="p-8 rounded-2xl bg-[#111111] border border-[#262626] text-center">
              <p className="text-sm text-[#52525B]">Full-text search requires database indexing. Use the module pages to browse.</p>
              <div className="flex justify-center gap-3 mt-4">
                <Link href="/customers">
                  <button className="px-4 py-2 rounded-xl bg-[#171717] border border-[#262626] text-sm text-[#A1A1AA] hover:text-white transition-colors">Customers</button>
                </Link>
                <Link href="/assets">
                  <button className="px-4 py-2 rounded-xl bg-[#171717] border border-[#262626] text-sm text-[#A1A1AA] hover:text-white transition-colors">Assets</button>
                </Link>
                <Link href="/invoices">
                  <button className="px-4 py-2 rounded-xl bg-[#171717] border border-[#262626] text-sm text-[#A1A1AA] hover:text-white transition-colors">Invoices</button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-[11px] text-[#52525B] uppercase tracking-wider font-medium mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all group">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-[#52525B] uppercase tracking-wider font-medium mb-4">Navigate To</p>
          <div className="space-y-1">
            {[
              { label: 'Dashboard', href: '/' },
              { label: 'Customers', href: '/customers' },
              { label: 'Assets', href: '/assets' },
              { label: 'Contracts', href: '/contracts' },
              { label: 'Invoices', href: '/invoices' },
              { label: 'Quotations', href: '/quotations' },
              { label: 'Tickets', href: '/tickets' },
              { label: 'Engineers', href: '/engineers' },
              { label: 'Implementations', href: '/implementations' },
              { label: 'Documents', href: '/documents' },
              { label: 'Settings', href: '/settings' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-[#111111] text-[#A1A1AA] hover:text-white transition-all">
                  <span className="text-sm">{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
