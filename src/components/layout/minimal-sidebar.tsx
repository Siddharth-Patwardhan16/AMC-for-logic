'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Receipt,
  Search,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard, short: 'Overview' },
  { name: 'Customers', href: '/customers', icon: Users, short: 'Customers' },
  { name: 'Finance', href: '/invoices', icon: Receipt, short: 'Finance' },
  { name: 'Search', href: '/search', icon: Search, short: 'Search' },
]

export function MinimalSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-colors"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-[#0A0A0A] border-r border-[#262626] flex flex-col transition-all duration-300',
          'w-[200px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#4F8CFF]/10 flex items-center justify-center">
              <div className="h-3 w-3 rounded-sm bg-[#4F8CFF]" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">AMC</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative',
                  active
                    ? 'text-white'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#171717]/50'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-[#171717]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={cn('h-4 w-4 relative z-10', active ? 'text-[#4F8CFF]' : '')} />
                <span className="relative z-10">{item.name}</span>
                {active && item.href !== '/search' && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto relative z-10 text-[#A1A1AA]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom hint */}
        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] text-[11px] text-[#A1A1AA]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#171717] text-[#F5F5F5] text-[10px] font-mono">/</kbd> to search
          </div>
        </div>
      </motion.aside>
    </>
  )
}
