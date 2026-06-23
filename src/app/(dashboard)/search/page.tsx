'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ArrowRight, Users, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { CompanyBadge } from '@/components/company/company-selector'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const debouncedQuery = useDebouncedValue(searchQuery)
  const { companyFilter } = useCompany()

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const { data, isLoading } = trpc.customer.list.useQuery(
    {
      companyId: companyFilter,
      search: debouncedQuery || undefined,
      pageSize: 20,
    },
    { enabled: debouncedQuery.trim().length > 0 },
  )

  const customers = data?.items ?? []

  return (
    <div className="p-5 lg:p-8 max-w-[800px] mx-auto">
      <FadeIn>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Search Customers</h1>
        <p className="text-sm text-[#A1A1AA] mb-6">Find a customer by name or GST number</p>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
            <Input
              placeholder="Search customer name or GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
              autoFocus
            />
          </div>
        </form>

        {debouncedQuery.trim() && (
          <div className="mb-8">
            <p className="text-sm text-[#A1A1AA] mb-4">
              {isLoading ? 'Searching...' : `${data?.total ?? 0} result(s) for "${debouncedQuery}"`}
            </p>

            {customers.length > 0 ? (
              <div className="space-y-2">
                {customers.map((customer: any, i: number) => (
                  <FadeIn key={customer.id} staggerIndex={i % 6}>
                    <Link href={`/customers/${customer.id}`}>
                      <div className="flex items-center justify-between rounded-2xl border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#333333]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] font-bold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{customer.name}</p>
                            <p className="text-xs text-[#52525B]">{customer.gst || 'No GST'} · {customer.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {customer.company?.name && <CompanyBadge name={customer.company.name} />}
                          <ArrowRight className="h-4 w-4 text-[#52525B]" />
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            ) : !isLoading ? (
              <div className="rounded-2xl border border-[#262626] bg-[#111111] p-8 text-center">
                <p className="text-sm text-[#A1A1AA]">No customers found</p>
                <Link href="/customers/new" className="mt-3 inline-flex items-center gap-2 text-sm text-[#4F8CFF] hover:underline">
                  <Plus className="h-4 w-4" />
                  Add new customer
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {!debouncedQuery.trim() && (
          <div className="rounded-2xl border border-[#262626] bg-[#111111] p-6">
            <p className="text-[11px] text-[#52525B] uppercase tracking-wider font-medium mb-3">Quick links</p>
            <div className="space-y-1">
              {[
                { label: 'All Customers', href: '/customers' },
                { label: 'Finance — AMC & Payments', href: '/finance' },
                { label: 'Operations — Reminders', href: '/operations' },
                { label: 'New Customer', href: '/customers/new' },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#171717] text-[#A1A1AA] hover:text-white transition-all">
                    <span className="text-sm">{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
