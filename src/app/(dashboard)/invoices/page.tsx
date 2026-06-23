'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Receipt, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'

const statusColors: Record<string, string> = {
  DRAFT: 'text-[#A1A1AA] bg-[#171717]',
  SENT: 'text-[#4F8CFF] bg-[#4F8CFF]/10',
  PARTIAL: 'text-[#EAB308] bg-[#EAB308]/10',
  PAID: 'text-[#22C55E] bg-[#22C55E]/10',
  OVERDUE: 'text-[#EF4444] bg-[#EF4444]/10',
  CANCELLED: 'text-[#52525B] bg-[#171717]',
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState('')
  const { companyFilter } = useCompany()
  const { page, setPage } = useListPage(debouncedSearch, status, companyFilter)

  const { data } = trpc.invoice.list.useQuery({
    companyId: companyFilter,
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
  })
  const invoices = data?.items ?? []

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Invoices & payments</p>
        </div>
        <Link href="/invoices/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-sm font-medium transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search invoices..."
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
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice, i) => (
          <FadeIn key={invoice.id} staggerIndex={i % 6}>
            <Link href={`/invoices/${invoice.id}`}>
              <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all duration-300 group cursor-pointer flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-4 w-4 text-[#4F8CFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{invoice.invoiceNumber}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusColors[invoice.status] || statusColors.DRAFT}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B]">{invoice.customer?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-white">₹{Number(invoice.totalAmount).toLocaleString()}</p>
                  <p className="text-xs text-[#52525B]">Due {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#52525B] group-hover:text-[#4F8CFF] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          </FadeIn>
        ))}
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-16">
          <div className="h-12 w-12 rounded-2xl bg-[#171717] flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-5 w-5 text-[#52525B]" />
          </div>
          <p className="text-sm text-[#A1A1AA]">No invoices found</p>
          <p className="text-xs text-[#52525B] mt-1">Create your first invoice</p>
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
