'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Users, ArrowRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'

const statusColors: Record<string, string> = {
  LEAD: 'text-[#4F8CFF] bg-[#4F8CFF]/10',
  PROSPECT: 'text-[#EAB308] bg-[#EAB308]/10',
  ACTIVE: 'text-[#22C55E] bg-[#22C55E]/10',
  INACTIVE: 'text-[#A1A1AA] bg-[#171717]',
  CLOSED: 'text-[#EF4444] bg-[#EF4444]/10',
  ARCHIVED: 'text-[#52525B] bg-[#171717]',
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [companyId, setCompanyId] = useState('')

  const { data: companies } = trpc.company.list.useQuery()
  const { data: customers } = trpc.customer.list.useQuery({
    companyId,
    status: status || undefined,
    search: search || undefined,
  })

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">{customers?.length || 0} total</p>
        </div>
        <Link href="/customers/new">
          <Button className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#4F8CFF]/30"
        >
          <option value="">All Status</option>
          <option value="LEAD">Lead</option>
          <option value="PROSPECT">Prospect</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers?.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link href={`/customers/${customer.id}`}>
              <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] text-lg font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{customer.name}</p>
                      <p className="text-xs text-[#52525B]">{customer.industry || 'No industry'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${statusColors[customer.status] || statusColors.ACTIVE}`}>
                    {customer.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#171717]/50">
                    <p className="text-lg font-bold text-white">{customer._count?.assets || 0}</p>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wide">Assets</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#171717]/50">
                    <p className="text-lg font-bold text-white">{customer._count?.contracts || 0}</p>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wide">Contracts</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#171717]/50">
                    <p className="text-lg font-bold text-white">{customer._count?.tickets || 0}</p>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wide">Tickets</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                  <p className="text-xs text-[#52525B]">{customer.gst || 'No GST'}</p>
                  <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {customers?.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <Users className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No customers found</p>
          <p className="text-xs text-[#52525B] mt-1">Add your first customer to get started</p>
        </div>
      )}
    </div>
  )
}
