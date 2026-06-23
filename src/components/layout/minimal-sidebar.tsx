'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Receipt,
  Search,
  Menu,
  X,
  ChevronRight,
  HardDrive,
  FileText,
  Ticket,
  Wrench,
  ClipboardList,
  FolderOpen,
  Package,
  Megaphone,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard },
      { name: 'Search', href: '/search', icon: Search },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'CRM', href: '/crm', icon: Megaphone },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Invoices', href: '/invoices', icon: Receipt },
      { name: 'Quotations', href: '/quotations', icon: FileText },
      { name: 'Contracts', href: '/contracts', icon: FileText },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Assets', href: '/assets', icon: HardDrive },
      { name: 'Tickets', href: '/tickets', icon: Ticket },
      { name: 'Engineers', href: '/engineers', icon: Wrench },
      { name: 'Implementations', href: '/implementations', icon: ClipboardList },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { name: 'Materials', href: '/materials', icon: Package },
      { name: 'Documents', href: '/documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
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

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-[#0A0A0A] border-r border-[#262626] flex flex-col transition-all duration-300',
          'w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center px-5 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#4F8CFF]/10 flex items-center justify-center">
              <div className="h-3 w-3 rounded-sm bg-[#4F8CFF]" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">AMC</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#52525B]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all relative',
                        active
                          ? 'text-white'
                          : 'text-[#A1A1AA] hover:text-white hover:bg-[#171717]/50'
                      )}
                    >
                      {active && (
                        <div className="absolute inset-0 rounded-xl bg-[#171717]" />
                      )}
                      <item.icon className={cn('h-4 w-4 flex-shrink-0 relative z-10', active ? 'text-[#4F8CFF]' : '')} />
                      <span className="relative z-10 truncate">{item.name}</span>
                      {active && item.href !== '/search' && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0 relative z-10 text-[#A1A1AA]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom hint */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] text-[11px] text-[#A1A1AA]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#171717] text-[#F5F5F5] text-[10px] font-mono">/</kbd> to search
          </div>
        </div>
      </aside>
    </>
  )
}
