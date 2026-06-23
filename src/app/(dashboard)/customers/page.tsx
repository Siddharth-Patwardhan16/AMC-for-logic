'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { CompanyBadge, CompanySelector } from '@/components/company/company-selector'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'

const statusColors: Record<string, string> = {
  LEAD: 'text-[#4F8CFF] bg-[#4F8CFF]/10',
  PROSPECT: 'text-[#EAB308] bg-[#EAB308]/10',
  ACTIVE: 'text-[#22C55E] bg-[#22C55E]/10',
  INACTIVE: 'text-[#A1A1AA] bg-[#171717]',
  CLOSED: 'text-[#EF4444] bg-[#EF4444]/10',
  ARCHIVED: 'text-[#52525B] bg-[#171717]',
}

function CustomerCard({ customer, i }: { customer: any; i: number }) {
  return (
    <FadeIn staggerIndex={i % 6}>
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

          {customer.company?.name && (
            <div className="mb-3">
              <CompanyBadge name={customer.company.name} />
            </div>
          )}

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
    </FadeIn>
  )
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState('')
  const { companyFilter, isAllCompanies } = useCompany()
  const { page, setPage } = useListPage(debouncedSearch, status, companyFilter)

  const { data } = trpc.customer.list.useQuery({
    companyId: companyFilter,
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
  })

  const customers = data?.items ?? []

  const groupedByCompany = useMemo(() => {
    if (!isAllCompanies || !customers.length) return null
    const map = new Map<string, { companyName: string; customers: typeof customers }>()
    for (const c of customers) {
      const key = c.company?.id ?? 'unknown'
      const name = c.company?.name ?? 'Unassigned'
      if (!map.has(key)) map.set(key, { companyName: name, customers: [] })
      map.get(key)!.customers.push(c)
    }
    return Array.from(map.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
  }, [customers, isAllCompanies])

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {data?.total ?? 0} total
            {isAllCompanies ? ' · all companies' : ' · filtered by company'}
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </Link>
      </div>

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
        <CompanySelector className="sm:hidden w-full" />
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

      {groupedByCompany ? (
        <div className="space-y-10">
          {groupedByCompany.map((group) => (
            <section key={group.companyName}>
              <div className="flex items-center gap-3 mb-4">
                <CompanyBadge name={group.companyName} />
                <span className="text-xs text-[#52525B]">{group.customers.length} customers</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.customers.map((customer, i) => (
                  <CustomerCard key={customer.id} customer={customer} i={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer, i) => (
            <CustomerCard key={customer.id} customer={customer} i={i} />
          ))}
        </div>
      )}

      {customers.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <Users className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No customers found</p>
          <p className="text-xs text-[#52525B] mt-1">Add your first customer, import from Excel, or set the company filter to &quot;All companies&quot;</p>
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        pageSize={data?.pageSize ?? 24}
        onPageChange={setPage}
      />
    </div>
  )
}
