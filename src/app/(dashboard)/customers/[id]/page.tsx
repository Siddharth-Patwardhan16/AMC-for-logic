'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { FadeIn } from '@/components/ui/fade-in'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Receipt,
  MapPin,
  Building2,
  CheckCircle2,
  TrendingUp,
  Edit3,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { AmcBillingPanel } from '@/components/customers/amc-billing-panel'
import { CompanyBadge } from '@/components/company/company-selector'
import { customerPaymentSummaries } from '@/lib/amc-payment-utils'
import { formatMoney } from '@/components/finance/quarter-status'

function contractProgress(contract: { startDate: Date | string; endDate: Date | string }) {
  const start = new Date(contract.startDate).getTime()
  const end = new Date(contract.endDate).getTime()
  const now = Date.now()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
}

function TimelineItem({ icon: Icon, title, subtitle, date, type }: any) {
  const dotColors: Record<string, string> = {
    invoice: 'bg-[#4F8CFF]',
    asset: 'bg-[#22C55E]',
    ticket: 'bg-[#EF4444]',
    visit: 'bg-[#EAB308]',
    contract: 'bg-[#A855F7]',
    implementation: 'bg-[#3B82F6]',
  }
  const dotColor = dotColors[type] || 'bg-[#A1A1AA]'

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="timeline-line" />
      <div className={`absolute left-[11px] top-1 h-2 w-2 rounded-full ${dotColor} ring-4 ring-[#0A0A0A]`} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-3.5 w-3.5 text-[#A1A1AA]" />
            <p className="text-sm font-medium text-white">{title}</p>
          </div>
          <p className="text-xs text-[#A1A1AA]">{subtitle}</p>
        </div>
        <p className="text-[11px] text-[#52525B] whitespace-nowrap ml-4">{date}</p>
      </div>
    </div>
  )
}

export default function CustomerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-[#4F8CFF] border-t-transparent animate-spin" />
        </div>
      }
    >
      <CustomerDetailContent />
    </Suspense>
  )
}

function CustomerDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const initialTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.replace(`/customers/${id}?tab=${tab}`, { scroll: false })
  }

  const { data: customer } = trpc.customer.get.useQuery({ id })

  const { data: amcSchedules, isLoading: amcLoading } = trpc.amcSchedule.getByCustomer.useQuery(
    { customerId: id },
    { enabled: activeTab === 'amc' }
  )

  if (!customer) return (
    <div className="p-8 flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-[#4F8CFF] border-t-transparent animate-spin" />
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'amc', label: 'AMC & Payments' },
    { id: 'history', label: 'History' },
    { id: 'finance', label: 'Invoices & Quotes' },
  ]

  // Build timeline from all customer data
  const timelineItems = [
    ...customer.contracts.map((c: any) => ({
      type: 'contract',
      icon: FileText,
      title: `Contract ${c.contractNumber}`,
      subtitle: `${c.contractType.replace('_', ' ')} · ${formatMoney(c.value)}`,
      date: new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: new Date(c.startDate).getTime(),
    })),
    ...customer.invoices.map((i: any) => ({
      type: 'invoice',
      icon: Receipt,
      title: `Invoice ${i.invoiceNumber}`,
      subtitle: `₹${Number(i.totalAmount).toLocaleString()} · ${i.status}`,
      date: new Date(i.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: new Date(i.issueDate).getTime(),
    })),
    ...((customer as any).quotations ?? []).map((q: any) => ({
      type: 'contract',
      icon: FileText,
      title: `Quotation ${q.quotationNumber}`,
      subtitle: `${formatMoney(q.totalAmount)} · ${q.status}`,
      date: new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: new Date(q.createdAt).getTime(),
    })),
    ...customer.payments.map((p: any) => ({
      type: 'invoice',
      icon: Receipt,
      title: 'Payment received',
      subtitle: `${formatMoney(p.amount)} · ${p.paymentMode?.replace('_', ' ') ?? 'Payment'}`,
      date: new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: new Date(p.paymentDate).getTime(),
    })),
  ].sort((a: any, b: any) => b.rawDate - a.rawDate)

  return (
    <div className="p-5 lg:p-8 max-w-[1200px] mx-auto">
      {/* Back */}
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Customers
      </Link>

      {/* Customer Header */}
      <FadeIn className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] text-xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{customer.name}</h1>
                <Badge variant={customer.status === 'ACTIVE' ? 'success' : customer.status === 'LEAD' ? 'default' : 'secondary'} className="text-[10px]">
                  {customer.status}
                </Badge>
              </div>
              <p className="text-sm text-[#A1A1AA] mt-0.5 flex flex-wrap items-center gap-2">
                <span>{customer.industry || 'No industry'} · {customer.gst || 'No GST'}</span>
                {(customer as any).createdBy?.name && (
                  <span className="text-[#52525B]">· Created by {(customer as any).createdBy.name}</span>
                )}
                {(customer as any).company?.name && (
                  <CompanyBadge name={(customer as any).company.name} />
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/customers/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#262626] bg-[#111111] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-[#333333]"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
            {customer.contactPersons?.[0] && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white">{customer.contactPersons[0].name}</p>
                <p className="text-xs text-[#A1A1AA]">{customer.contactPersons[0].designation}</p>
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Stats Bar */}
      <FadeIn delay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: FileText, label: 'Contracts', value: customer.contracts?.length || 0, color: 'text-[#4F8CFF]' },
          { icon: Receipt, label: 'Invoices', value: customer.invoices?.length || 0, color: 'text-[#EAB308]' },
          { icon: FileText, label: 'Quotations', value: ((customer as any).quotations ?? []).length, color: 'text-[#06B6D4]' },
          { icon: TrendingUp, label: 'Payments', value: customer.payments?.length || 0, color: 'text-[#22C55E]' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-[#111111] border border-[#262626]">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <span className="text-xs text-[#A1A1AA]">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.2} className="mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111111] border border-[#262626] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Tab Content */}
      <FadeIn key={activeTab}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AMC Status */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">AMC Status</h3>
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
              </div>
              {customer.contracts?.[0] ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A1A1AA]">Contract</span>
                    <span className="text-sm text-white font-medium">{customer.contracts[0].contractNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A1A1AA]">Value</span>
                    <span className="text-sm text-white font-medium">{formatMoney(customer.contracts[0].value)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A1A1AA]">Expires</span>
                    <span className="text-sm text-[#EAB308]">{new Date(customer.contracts[0].endDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#171717] overflow-hidden mt-2">
                    <div className="h-full bg-[#22C55E] rounded-full" style={{ width: `${contractProgress(customer.contracts[0])}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#52525B]">No active AMC contract</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
              <h3 className="text-sm font-semibold text-white mb-4">Contact Details</h3>
              <div className="space-y-3">
                {customer.contactPersons?.map((cp: any) => (
                  <div key={cp.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#171717]/50">
                    <div className="h-8 w-8 rounded-full bg-[#4F8CFF]/10 flex items-center justify-center text-[#4F8CFF] text-xs font-bold">
                      {cp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{cp.name}</p>
                      <p className="text-xs text-[#A1A1AA]">{cp.designation}</p>
                    </div>
                    {cp.isPrimary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                  </div>
                )) || <p className="text-sm text-[#52525B]">No contact persons</p>}
              </div>
              {customer.billingAddress && (
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#A1A1AA] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#A1A1AA]">{customer.billingAddress}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Outstanding */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
              <h3 className="text-sm font-semibold text-white mb-4">Outstanding</h3>
              {(() => {
                const { outstanding } = customerPaymentSummaries((customer as any).amcSchedules ?? [])
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-[#EF4444]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{formatMoney(outstanding)}</p>
                      <p className="text-xs text-[#A1A1AA]">
                        {outstanding > 0 ? 'Pending quarterly EMIs' : 'No pending payments'}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Locations */}
            <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626]">
              <h3 className="text-sm font-semibold text-white mb-4">Locations</h3>
              <div className="space-y-2">
                {customer.locations?.map((loc: any) => (
                  <div key={loc.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#171717]/50">
                    <Building2 className="h-3.5 w-3.5 text-[#A1A1AA]" />
                    <div>
                      <p className="text-sm text-white">{loc.name}</p>
                      <p className="text-xs text-[#52525B]">{loc.city || 'No city'}</p>
                    </div>
                    {loc.isHeadOffice && <Badge variant="subtle" className="text-[10px] ml-auto">HQ</Badge>}
                  </div>
                )) || <p className="text-sm text-[#52525B]">No locations</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amc' && (
          amcLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 rounded-full border-2 border-[#4F8CFF] border-t-transparent animate-spin" />
            </div>
          ) : (
            <AmcBillingPanel
              customerId={id}
              companyId={customer.companyId}
              schedules={amcSchedules ?? []}
            />
          )
        )}

        {activeTab === 'history' && (
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626]">
            <h3 className="text-sm font-semibold text-white mb-6">Customer History</h3>
            <p className="text-xs text-[#52525B] mb-6">Contracts, invoices, quotations, and AMC payments for this customer.</p>
            {timelineItems.length > 0 ? (
              <div>
                {timelineItems.map((item: any, i: number) => (
                  <TimelineItem key={i} {...item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#52525B]">No activity yet</p>
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#262626] bg-[#111111] p-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Finance actions</h3>
                <p className="mt-1 text-xs text-[#A1A1AA]">Create customer-prefilled documents or open recent records.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/invoices/new?customerId=${id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#4F8CFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4F8CFF]/90">
                  <Plus className="h-4 w-4" />
                  New Invoice
                </Link>
                <Link href={`/quotations/new?customerId=${id}`} className="inline-flex items-center gap-2 rounded-xl border border-[#262626] bg-[#171717] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-[#333333]">
                  <Plus className="h-4 w-4" />
                  New Quotation
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <section className="rounded-2xl border border-[#262626] bg-[#111111]">
                <div className="border-b border-[#262626] px-4 py-3">
                  <h3 className="text-sm font-semibold text-white">Invoices</h3>
                </div>
                <div className="space-y-2 p-3">
                  {customer.invoices?.length ? customer.invoices.map((inv: any) => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 transition-colors hover:border-[#333333]">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#4F8CFF]/10 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-[#4F8CFF]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{inv.invoiceNumber}</p>
                          <p className="text-xs text-[#52525B]">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatMoney(inv.totalAmount)}</p>
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'destructive' : 'warning'} className="text-[10px]">{inv.status}</Badge>
                      </div>
                    </Link>
                  )) : (
                    <p className="p-4 text-sm text-[#52525B]">No invoices yet</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#262626] bg-[#111111]">
                <div className="border-b border-[#262626] px-4 py-3">
                  <h3 className="text-sm font-semibold text-white">Quotations</h3>
                </div>
                <div className="space-y-2 p-3">
                  {((customer as any).quotations ?? []).length ? (customer as any).quotations.map((quote: any) => (
                    <Link key={quote.id} href={`/quotations/${quote.id}`} className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 transition-colors hover:border-[#333333]">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#06B6D4]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{quote.quotationNumber}</p>
                          <p className="text-xs text-[#52525B]">v{quote.version}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatMoney(quote.totalAmount)}</p>
                        <Badge variant={quote.status === 'APPROVED' ? 'success' : quote.status === 'REJECTED' ? 'destructive' : 'default'} className="text-[10px]">{quote.status}</Badge>
                      </div>
                    </Link>
                  )) : (
                    <p className="p-4 text-sm text-[#52525B]">No quotations yet</p>
                  )}
                </div>
              </section>
            </div>

            {customer.payments?.length ? (
              <section className="rounded-2xl border border-[#262626] bg-[#111111]">
                <div className="border-b border-[#262626] px-4 py-3">
                  <h3 className="text-sm font-semibold text-white">Recent payments</h3>
                </div>
                <div className="divide-y divide-[#262626]">
                  {customer.payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-white">{payment.paymentMode?.replace('_', ' ') ?? 'Payment'}</p>
                        <p className="text-xs text-[#52525B]">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      <p className="text-sm font-medium text-white">{formatMoney(payment.amount)}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </FadeIn>
    </div>
  )
}
