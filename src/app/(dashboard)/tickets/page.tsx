'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Ticket, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'

const priorityColors: Record<string, string> = {
  LOW: 'text-[#A1A1AA] bg-[#171717]',
  MEDIUM: 'text-[#4F8CFF] bg-[#4F8CFF]/10',
  HIGH: 'text-[#EAB308] bg-[#EAB308]/10',
  CRITICAL: 'text-[#EF4444] bg-[#EF4444]/10',
}

const statusColors: Record<string, string> = {
  OPEN: 'text-[#4F8CFF] bg-[#4F8CFF]/10',
  ASSIGNED: 'text-[#A855F7] bg-[#A855F7]/10',
  IN_PROGRESS: 'text-[#EAB308] bg-[#EAB308]/10',
  WAITING: 'text-[#A1A1AA] bg-[#171717]',
  RESOLVED: 'text-[#22C55E] bg-[#22C55E]/10',
  CLOSED: 'text-[#52525B] bg-[#171717]',
}

export default function TicketsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const { data: tickets } = trpc.ticket.list.useQuery({
    status: status || undefined,
    priority: priority || undefined,
  })

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tickets</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Support & service requests</p>
        </div>
        <Link href="/tickets/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Ticket
          </button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search tickets..."
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
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="space-y-3">
        {tickets?.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <Link href={`/tickets/${ticket.id}`}>
              <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center flex-shrink-0">
                  <Ticket className="h-4 w-4 text-[#EF4444]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{ticket.ticketNumber}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${priorityColors[ticket.priority] || priorityColors.LOW}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B] truncate">{ticket.title}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-[#A1A1AA]">{ticket.customer?.name}</p>
                  <p className="text-[10px] text-[#52525B]">{ticket.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {tickets?.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <Ticket className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No tickets found</p>
          <p className="text-xs text-[#52525B] mt-1">Create your first ticket</p>
        </div>
      )}
    </div>
  )
}
