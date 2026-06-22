'use client'

import { Building2, ChevronDown } from 'lucide-react'
import { trpc } from '@/components/providers'
import { useCompany } from './company-context'
import { cn } from '@/lib/utils'

export function CompanySelector({ className }: { className?: string }) {
  const { selectedCompanyId, setSelectedCompanyId, isAllCompanies } = useCompany()
  const { data: companies } = trpc.company.list.useQuery()

  const selectedName = isAllCompanies
    ? 'All companies'
    : companies?.find((c) => c.id === selectedCompanyId)?.name ?? 'Company'

  return (
    <div className={cn('relative', className)}>
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4F8CFF] pointer-events-none" />
      <select
        value={selectedCompanyId ?? ''}
        onChange={(e) => setSelectedCompanyId(e.target.value || null)}
        className="h-9 pl-9 pr-8 rounded-xl bg-[#111111] border border-[#262626] text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30 appearance-none cursor-pointer min-w-[160px] max-w-[220px]"
        title={selectedName}
      >
        <option value="">All companies</option>
        {companies?.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#52525B] pointer-events-none" />
    </div>
  )
}

export function CompanyBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium',
      'text-[#4F8CFF] bg-[#4F8CFF]/10 border border-[#4F8CFF]/20',
      className
    )}>
      <Building2 className="h-3 w-3" />
      {name}
    </span>
  )
}
