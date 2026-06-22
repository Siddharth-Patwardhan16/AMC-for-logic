'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  HardDrive,
  FileText,
  Receipt,
  Wrench,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/components/providers'
import { AmcBillingPanel } from '@/components/customers/amc-billing-panel'
import { CompanyBadge } from '@/components/company/company-selector'

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE: { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', label: 'Active' },
  INACTIVE: { color: 'text-[#A1A1AA]', bg: 'bg-[#171717]', label: 'Inactive' },
  LEAD: { color: 'text-[#4F8CFF]', bg: 'bg-[#4F8CFF]/10', label: 'Lead' },
  PROSPECT: { color: 'text-[#EAB308]', bg: 'bg-[#EAB308]/10', label: 'Prospect' },
  CLOSED: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: 'Closed' },
  ARCHIVED: { color: 'text-[#52525B]', bg: 'bg-[#171717]', label: 'Archived' },
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
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  const { data: customer } = trpc.customer.get.useQuery({ id })

  if (!customer) return (
    <div className="p-8 flex items-center justify-center">
      <div className="h-5 w-5 rounded-full border-2 border-[#4F8CFF] border-t-transparent animate-spin" />
    </div>
  )

  const status = statusConfig[customer.status] || statusConfig.ACTIVE

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'amc', label: 'AMC Billing' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'assets', label: 'Assets' },
    { id: 'finance', label: 'Finance' },
    { id: 'documents', label: 'Documents' },
  ]

  // Build timeline from all customer data
  const timelineItems = [
    ...customer.contracts.map((c: any) => ({
      type: 'contract',
      icon: FileText,
      title: `Contract ${c.contractNumber}`,
      subtitle: `${c.contractType.replace('_', ' ')} · ₹${Number(c.value).toLocaleString()}`,
      date: new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
    ...customer.assets.map((a: any) => ({
      type: 'asset',
      icon: HardDrive,
      title: `${a.name} installed`,
      subtitle: `${a.assetType.replace('_', ' ')} · ${a.serialNumber}`,
      date: a.installationDate ? new Date(a.installationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not installed',
    })),
    ...customer.invoices.map((i: any) => ({
      type: 'invoice',
      icon: Receipt,
      title: `Invoice ${i.invoiceNumber}`,
      subtitle: `₹${Number(i.totalAmount).toLocaleString()} · ${i.status}`,
      date: new Date(i.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
    ...customer.tickets.map((t: any) => ({
      type: 'ticket',
      icon: AlertCircle,
      title: t.title,
      subtitle: `${t.status} · ${t.priority}`,
      date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
    ...customer.payments.map((p: any) => ({
      type: 'invoice',
      icon: Receipt,
      title: `Payment received`,
      subtitle: `₹${Number(p.amount).toLocaleString()} · ${p.paymentMode?.replace('_', ' ') ?? 'Payment'}`,
      date: new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
    ...customer.implementations.map((imp: any) => ({
      type: 'implementation',
      icon: Wrench,
      title: imp.title,
      subtitle: imp.engineerName ? `By ${imp.engineerName}` : 'No engineer assigned',
      date: new Date(imp.implementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    })),
  ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-5 lg:p-8 max-w-[1200px] mx-auto">
      {/* Back */}
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Customers
      </Link>

      {/* Customer Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
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
                {(customer as any).company?.name && (
                  <CompanyBadge name={(customer as any).company.name} />
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customer.contactPersons?.[0] && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white">{customer.contactPersons[0].name}</p>
                <p className="text-xs text-[#A1A1AA]">{customer.contactPersons[0].designation}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: FileText, label: 'Contracts', value: customer.contracts?.length || 0, color: 'text-[#4F8CFF]' },
          { icon: HardDrive, label: 'Assets', value: customer.assets?.length || 0, color: 'text-[#22C55E]' },
          { icon: Receipt, label: 'Invoices', value: customer.invoices?.length || 0, color: 'text-[#EAB308]' },
          { icon: AlertCircle, label: 'Tickets', value: customer.tickets?.length || 0, color: 'text-[#EF4444]' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-[#111111] border border-[#262626]">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <span className="text-xs text-[#A1A1AA]">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111111] border border-[#262626] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      </motion.div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
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
                    <span className="text-sm text-white font-medium">₹{Number(customer.contracts[0].value).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A1A1AA]">Expires</span>
                    <span className="text-sm text-[#EAB308]">{new Date(customer.contracts[0].endDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#171717] overflow-hidden mt-2">
                    <div className="h-full bg-[#22C55E] rounded-full" style={{ width: '75%' }} />
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
                const installments = (customer as any).amcSchedules
                  ?.filter((s: any) => s.enableQuarterlySplit)
                  ?.flatMap((s: any) => s.installments ?? []) ?? []
                const outstanding = installments.reduce((sum: number, i: any) => {
                  const due = Number(i.amount) - Number(i.paidAmount)
                  return sum + (due > 0 ? due : 0)
                }, 0)
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-[#EF4444]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">₹{outstanding.toLocaleString()}</p>
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
          <AmcBillingPanel
            customerId={id}
            companyId={customer.companyId}
            schedules={(customer as any).amcSchedules ?? []}
          />
        )}

        {activeTab === 'timeline' && (
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#262626]">
            <h3 className="text-sm font-semibold text-white mb-6">Customer History</h3>
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

        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.assets?.map((asset: any) => (
              <div key={asset.id} className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                      <HardDrive className="h-4 w-4 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{asset.name}</p>
                      <p className="text-xs text-[#52525B]">{asset.serialNumber}</p>
                    </div>
                  </div>
                  <Badge variant={asset.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">{asset.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                  <span>{asset.assetType.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>{asset.model || 'No model'}</span>
                </div>
              </div>
            )) || <p className="text-sm text-[#52525B]">No assets</p>}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            {customer.invoices?.map((inv: any) => (
              <div key={inv.id} className="p-4 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-between hover:border-[#333333] transition-all">
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
                  <p className="text-sm font-medium text-white">₹{Number(inv.totalAmount).toLocaleString()}</p>
                  <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'destructive' : 'warning'} className="text-[10px]">{inv.status}</Badge>
                </div>
              </div>
            )) || <p className="text-sm text-[#52525B]">No invoices</p>}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customer.documents?.map((doc: any) => (
              <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#333333] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#171717] flex items-center justify-center text-[10px] font-bold text-[#A1A1AA]">
                      {doc.fileType.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                      <p className="text-xs text-[#52525B]">v{doc.version} · {new Date(doc.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </a>
            )) || <p className="text-sm text-[#52525B]">No documents</p>}
          </div>
        )}
      </motion.div>
    </div>
  )
}
