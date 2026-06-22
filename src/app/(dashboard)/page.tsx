'use client'

import { motion } from 'framer-motion'
import { Users, HardDrive, FileText, AlertTriangle, ArrowUpRight, TrendingUp, Clock } from 'lucide-react'
import { trpc } from '@/components/providers'
import Link from 'next/link'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

function StatCard({ icon: Icon, label, value, subtext, color, delay }: any) {
  return (
    <motion.div variants={item} className={`animate-in stagger-${delay}`}>
      <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] transition-colors" />
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-[#A1A1AA] mt-0.5">{label}</p>
        {subtext && <p className="text-[11px] text-[#52525B] mt-2">{subtext}</p>}
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data: stats } = trpc.dashboard.stats.useQuery()

  const statCards = [
    { icon: Users, value: stats?.totalCustomers || 0, label: 'Active Customers', color: 'bg-[#4F8CFF]/10 text-[#4F8CFF]', subtext: `${stats?.activeCustomers || 0} currently active` },
    { icon: HardDrive, value: stats?.totalAssets || 0, label: 'Total Assets', color: 'bg-[#22C55E]/10 text-[#22C55E]', subtext: 'Under management' },
    { icon: FileText, value: stats?.pendingInvoices || 0, label: 'Pending Invoices', color: 'bg-[#EAB308]/10 text-[#EAB308]', subtext: 'Awaiting payment' },
    { icon: AlertTriangle, value: stats?.openTickets || 0, label: 'Open Tickets', color: 'bg-[#EF4444]/10 text-[#EF4444]', subtext: 'Need attention' },
  ]

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Your AMC business at a glance</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i + 1} />
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Contracts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Upcoming Renewals</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Contracts expiring in 90 days</p>
              </div>
              <Link href="/contracts" className="text-xs text-[#4F8CFF] hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {stats?.expiringContracts?.length ? stats.expiringContracts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#171717]/50 border border-[#262626]/50 hover:border-[#333333] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#EAB308]/10 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-[#EAB308]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{c.contractNumber}</p>
                      <p className="text-xs text-[#A1A1AA]">{c.customer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#EAB308]">{new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-[10px] text-[#52525B]">Expires</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-[#52525B]">
                  <p className="text-sm">No upcoming renewals</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Revenue */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Revenue</h2>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Total collected</p>
            </div>
            <div className="mb-6">
              <p className="text-3xl font-bold text-white tracking-tight">₹{Number(stats?.totalRevenue || 0).toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
                <span className="text-xs text-[#22C55E]">Annual AMC</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A1A1AA]">Active Contracts</span>
                <span className="text-white font-medium">{stats?.activeContracts || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A1A1AA]">Pending Collection</span>
                <span className="text-white font-medium">₹{Number(stats?.totalRevenue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom section: Recent activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
        <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/search" className="text-xs text-[#4F8CFF] hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recent Customers */}
            <div>
              <p className="text-[11px] text-[#52525B] uppercase tracking-wider font-medium mb-3">New Customers</p>
              <div className="space-y-2">
                {stats?.expiringContracts?.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-[#4F8CFF]/10 flex items-center justify-center text-[10px] text-[#4F8CFF] font-bold">{(c.customer?.name || 'A').charAt(0)}</div>
                    <p className="text-sm text-[#A1A1AA] truncate">{c.customer?.name}</p>
                  </div>
                )) || <p className="text-sm text-[#52525B]">No recent activity</p>}
              </div>
            </div>
            {/* Recent Tickets */}
            <div>
              <p className="text-[11px] text-[#52525B] uppercase tracking-wider font-medium mb-3">Open Tickets</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[#EF4444]" />
                  <p className="text-sm text-[#A1A1AA]">Server performance issue</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-[#EAB308]" />
                  <p className="text-sm text-[#A1A1AA]">Firewall configuration</p>
                </div>
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <p className="text-[11px] text-[#52525B] uppercase tracking-wider font-medium mb-3">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/customers/new">
                  <button className="px-3 py-1.5 rounded-lg bg-[#171717] border border-[#262626] text-xs text-[#A1A1AA] hover:text-white hover:border-[#333333] transition-all">+ Customer</button>
                </Link>
                <Link href="/invoices/new">
                  <button className="px-3 py-1.5 rounded-lg bg-[#171717] border border-[#262626] text-xs text-[#A1A1AA] hover:text-white hover:border-[#333333] transition-all">+ Invoice</button>
                </Link>
                <Link href="/tickets/new">
                  <button className="px-3 py-1.5 rounded-lg bg-[#171717] border border-[#262626] text-xs text-[#A1A1AA] hover:text-white hover:border-[#333333] transition-all">+ Ticket</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
