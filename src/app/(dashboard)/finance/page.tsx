'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Receipt, FileText, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FadeIn } from '@/components/ui/fade-in'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { useCompany } from '@/components/company/company-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListPage } from '@/hooks/use-list-page'
import { ListPagination } from '@/components/ui/list-pagination'
import { CompanyBadge } from '@/components/company/company-selector'
import { formatMoney, QuarterStatusRow } from '@/components/finance/quarter-status'

type FinanceTab = 'payments' | 'invoices' | 'quotations'

export default function FinancePage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [activeTab, setActiveTab] = useState<FinanceTab>('payments')
  const { companyFilter } = useCompany()
  const { page, setPage } = useListPage(debouncedSearch, activeTab, companyFilter)

  const { data: boardData, isLoading } = trpc.amcSchedule.customerPaymentBoard.useQuery({
    companyId: companyFilter,
    search: debouncedSearch || undefined,
    page,
  })

  const { data: invoicesData } = trpc.invoice.list.useQuery(
    {
      companyId: companyFilter,
      search: debouncedSearch || undefined,
      page,
    },
    { enabled: activeTab === 'invoices' },
  )

  const { data: quotationsData } = trpc.quotation.list.useQuery(
    {
      companyId: companyFilter,
      search: debouncedSearch || undefined,
      page,
    },
    { enabled: activeTab === 'quotations' },
  )

  const customers = boardData?.items ?? []
  const invoices = invoicesData?.items ?? []
  const quotations = quotationsData?.items ?? []

  const tabs: { id: FinanceTab; label: string }[] = [
    { id: 'payments', label: 'AMC Payments' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'quotations', label: 'Quotations' },
  ]

  const listMeta =
    activeTab === 'payments'
      ? boardData
      : activeTab === 'invoices'
        ? invoicesData
        : quotationsData

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      <FadeIn className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Finance</h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Customer AMC schedules, quarterly payments, invoices and quotations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F8CFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4F8CFF]/90"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-2 rounded-xl border border-[#262626] bg-[#111111] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-[#333333]"
            >
              <Plus className="h-4 w-4" />
              New Quotation
            </Link>
          </div>
        </div>
      </FadeIn>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111111] border border-[#262626] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
          <Input
            placeholder="Search by customer name or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 rounded-full border-2 border-[#4F8CFF] border-t-transparent animate-spin" />
            </div>
          ) : customers.length ? (
            customers.map((customer, i) => {
              const primarySchedule = customer.schedules[0]
              return (
                <FadeIn key={customer.id} staggerIndex={i % 6}>
                  <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4 lg:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Link href={`/customers/${customer.id}`} className="text-base font-semibold text-white hover:text-[#4F8CFF]">
                            {customer.name}
                          </Link>
                          {customer.company?.name && <CompanyBadge name={customer.company.name} />}
                          {customer.overdueQuarters > 0 && (
                            <Badge variant="destructive" className="text-[10px]">
                              {customer.overdueQuarters} overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#52525B] mb-3">
                          {customer.gst || 'No GST'} · {customer.invoiceCount} invoices · {customer.quotationCount} quotations
                        </p>

                        {primarySchedule ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                              <span>AMC {primarySchedule.fiscalYear}</span>
                              {primarySchedule.section && <span>· {primarySchedule.section}</span>}
                              {primarySchedule.companyName && <span>· {primarySchedule.companyName}</span>}
                            </div>
                            <QuarterStatusRow installments={primarySchedule.installments} />
                            {customer.schedules.length > 1 && (
                              <p className="text-[11px] text-[#52525B]">
                                +{customer.schedules.length - 1} more fiscal year schedule(s)
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[#52525B]">No AMC schedule yet</p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <div className="text-left lg:text-right">
                          <p className="text-[11px] uppercase tracking-wider text-[#52525B]">Outstanding</p>
                          <p className="text-xl font-bold text-white">{formatMoney(customer.outstanding)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/customers/${customer.id}?tab=amc`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-white"
                          >
                            AMC & Payments
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                          <Link
                            href={`/invoices/new?customerId=${customer.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-white"
                          >
                            Invoice
                          </Link>
                          <Link
                            href={`/quotations/new?customerId=${customer.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-white"
                          >
                            Quotation
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )
            })
          ) : (
            <div className="rounded-2xl border border-[#262626] bg-[#111111] p-10 text-center">
              <p className="text-sm text-[#A1A1AA]">No customers match your search</p>
              <Link href="/customers/new" className="mt-3 inline-block text-sm text-[#4F8CFF] hover:underline">
                Add a customer
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-2">
          {invoices.map((inv: any, i: number) => (
            <FadeIn key={inv.id} staggerIndex={i % 6}>
              <Link href={`/invoices/${inv.id}`}>
                <div className="flex items-center justify-between rounded-2xl border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#333333]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-[#4F8CFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{inv.invoiceNumber}</p>
                      <p className="text-xs text-[#52525B]">{inv.customer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatMoney(Number(inv.totalAmount))}</p>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'} className="text-[10px]">{inv.status}</Badge>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
          {!invoices.length && <p className="py-10 text-center text-sm text-[#52525B]">No invoices found</p>}
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="space-y-2">
          {quotations.map((quote: any, i: number) => (
            <FadeIn key={quote.id} staggerIndex={i % 6}>
              <Link href={`/quotations/${quote.id}`}>
                <div className="flex items-center justify-between rounded-2xl border border-[#262626] bg-[#111111] p-4 transition-colors hover:border-[#333333]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#06B6D4]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{quote.quotationNumber}</p>
                      <p className="text-xs text-[#52525B]">{quote.customer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatMoney(Number(quote.totalAmount))}</p>
                    <Badge variant="default" className="text-[10px]">{quote.status}</Badge>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
          {!quotations.length && <p className="py-10 text-center text-sm text-[#52525B]">No quotations found</p>}
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={listMeta?.totalPages ?? 1}
        total={listMeta?.total ?? 0}
        pageSize={listMeta?.pageSize ?? 24}
        onPageChange={setPage}
      />
    </div>
  )
}
