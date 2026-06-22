'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, HardHat, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  ENGINEER: 'Engineer',
  ACCOUNTS: 'Accounts',
  VIEWER: 'Viewer',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-[#22C55E] bg-[#22C55E]/10',
  INACTIVE: 'text-[#A1A1AA] bg-[#171717]',
  SUSPENDED: 'text-[#EF4444] bg-[#EF4444]/10',
}

export default function EngineersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const { data: engineers } = trpc.engineer.list.useQuery({
    role: role || undefined,
  })

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Engineers</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Team & assignments</p>
        </div>
        <Link href="/engineers/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Add Engineer
          </button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search engineers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[#111111] border border-[#262626] text-sm text-[#A1A1AA] focus:outline-none focus:border-[#4F8CFF]/30"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="ENGINEER">Engineer</option>
          <option value="ACCOUNTS">Accounts</option>
          <option value="VIEWER">Viewer</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engineers?.map((engineer, i) => (
          <motion.div
            key={engineer.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Link href={`/engineers/${engineer.id}`}>
              <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316] text-lg font-bold">
                      {(engineer.name || engineer.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{engineer.name || engineer.email}</p>
                      <p className="text-xs text-[#52525B]">{engineer.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${statusColors[engineer.status] || statusColors.ACTIVE}`}>
                    {engineer.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-[#262626]">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{engineer._count?.assignedTickets || 0}</p>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wide">Tickets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{engineer._count?.visits || 0}</p>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wide">Visits</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-[#A1A1AA]">{roleLabels[engineer.role]}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {engineers?.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <HardHat className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No engineers found</p>
          <p className="text-xs text-[#52525B] mt-1">Add your first engineer</p>
        </div>
      )}
    </div>
  )
}
