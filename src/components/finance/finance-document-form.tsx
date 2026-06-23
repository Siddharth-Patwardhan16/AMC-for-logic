'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers'
import { staticDataQueryOptions } from '@/lib/query-options'
import {
  calculateFinanceTotals,
  calculateLineItem,
  createEmptyLineItem,
  LineItemsEditor,
  type FinanceLineItem,
} from './line-items-editor'

type FinanceMode = 'invoice' | 'quotation'

interface FinanceDocumentFormProps {
  mode: FinanceMode
  initialCustomerId?: string
}

function inputDate(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function headingForMode(mode: FinanceMode) {
  return mode === 'invoice' ? 'New Invoice' : 'New Quotation'
}

function numberLabelForMode(mode: FinanceMode) {
  return mode === 'invoice' ? 'Invoice number' : 'Quotation number'
}

export function FinanceDocumentForm({ mode, initialCustomerId }: FinanceDocumentFormProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [customerId, setCustomerId] = useState(initialCustomerId ?? '')
  const [documentNumberOverride, setDocumentNumberOverride] = useState('')
  const [hasEditedNumber, setHasEditedNumber] = useState(false)
  const [issueDate, setIssueDate] = useState(inputDate(0))
  const [dueDate, setDueDate] = useState(inputDate(30))
  const [validUntil, setValidUntil] = useState(inputDate(30))
  const [status, setStatus] = useState('DRAFT')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [items, setItems] = useState<FinanceLineItem[]>(() => [createEmptyLineItem()])

  const { data: companies } = trpc.company.list.useQuery(undefined, staticDataQueryOptions)
  const { data: initialCustomer } = trpc.customer.get.useQuery(
    { id: initialCustomerId ?? '' },
    { enabled: Boolean(initialCustomerId) },
  )
  const companyId = selectedCompanyId || initialCustomer?.companyId || companies?.[0]?.id || ''

  const { data: customersData } = trpc.customer.list.useQuery(
    { companyId: companyId || undefined, pageSize: 100 },
    { enabled: Boolean(companyId) },
  )
  const customers = customersData?.items ?? []

  const invoiceNumberQuery = trpc.invoice.getNextNumber.useQuery(
    { companyId },
    { enabled: mode === 'invoice' && Boolean(companyId) },
  )
  const quotationNumberQuery = trpc.quotation.getNextNumber.useQuery(
    { companyId },
    { enabled: mode === 'quotation' && Boolean(companyId) },
  )
  const nextNumber = mode === 'invoice' ? invoiceNumberQuery.data : quotationNumberQuery.data
  const documentNumber = hasEditedNumber ? documentNumberOverride : nextNumber ?? ''

  const totals = useMemo(() => calculateFinanceTotals(items), [items])

  const createInvoice = trpc.invoice.create.useMutation({
    onSuccess: async (invoice) => {
      await Promise.all([
        utils.invoice.list.invalidate(),
        utils.customer.get.invalidate({ id: customerId }),
        utils.dashboard.stats.invalidate(),
        utils.dashboard.revenueChart.invalidate(),
      ])
      toast.success('Invoice created')
      router.push(`/invoices/${invoice.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const createQuotation = trpc.quotation.create.useMutation({
    onSuccess: async (quotation) => {
      await Promise.all([
        utils.quotation.list.invalidate(),
        utils.customer.get.invalidate({ id: customerId }),
      ])
      toast.success('Quotation created')
      router.push(`/quotations/${quotation.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const isSubmitting = createInvoice.isPending || createQuotation.isPending

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validItems = items.filter((item) => item.description.trim() && Number(item.quantity) > 0)
    if (!companyId) {
      toast.error('Select a company')
      return
    }
    if (!customerId) {
      toast.error('Select a customer')
      return
    }
    if (!documentNumber.trim()) {
      toast.error(`${numberLabelForMode(mode)} is required`)
      return
    }
    if (!validItems.length) {
      toast.error('Add at least one line item')
      return
    }

    const lineItems = validItems.map((item) => {
      const line = calculateLineItem(item)
      return {
        description: item.description.trim(),
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) || 0,
        total: line.total,
        itemType: item.itemType,
      }
    })

    if (mode === 'invoice') {
      createInvoice.mutate({
        invoiceNumber: documentNumber.trim(),
        status,
        issueDate,
        dueDate,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes: notes || undefined,
        terms: terms || undefined,
        customerId,
        companyId,
        items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          total: item.total,
        })),
      })
      return
    }

    createQuotation.mutate({
      quotationNumber: documentNumber.trim(),
      status,
      validUntil,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes: notes || undefined,
      terms: terms || undefined,
      customerId,
      companyId,
      items: lineItems,
    })
  }

  return (
    <div className="mx-auto max-w-[1200px] p-5 lg:p-8">
      <Link
        href={mode === 'invoice' ? '/invoices' : '/quotations'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {mode === 'invoice' ? 'Invoices' : 'Quotations'}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">{headingForMode(mode)}</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Create a tax-ready document with line items, discounts, GST, and customer context.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Document details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Company</Label>
              <select
                value={companyId}
                onChange={(event) => {
                  setSelectedCompanyId(event.target.value)
                  setCustomerId('')
                  setDocumentNumberOverride('')
                  setHasEditedNumber(false)
                }}
                className="h-10 w-full rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
              >
                <option value="">Select company</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Customer</Label>
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
              >
                <option value="">Select customer</option>
                {initialCustomer && !customers.some((customer) => customer.id === initialCustomer.id) && (
                  <option value={initialCustomer.id}>{initialCustomer.name}</option>
                )}
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">{numberLabelForMode(mode)}</Label>
              <Input
                value={documentNumber}
                onChange={(event) => {
                  setDocumentNumberOverride(event.target.value)
                  setHasEditedNumber(true)
                }}
                placeholder={mode === 'invoice' ? 'INV/2026-27/0001' : 'QOT/2026-27/0001'}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Status</Label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                {mode === 'quotation' && <option value="APPROVED">Approved</option>}
              </select>
            </div>
            {mode === 'invoice' ? (
              <>
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Issue date</Label>
                  <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Due date</Label>
                  <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
                </div>
              </>
            ) : (
              <div>
                <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Valid until</Label>
                <Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Line items</h2>
            <span className="text-xs text-[#52525B]">GST is calculated per line</span>
          </div>
          <LineItemsEditor
            items={items}
            onChange={setItems}
            showItemType={mode === 'quotation'}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Notes</Label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#4F8CFF]/30"
              placeholder="Internal or customer-facing notes"
            />
          </div>
          <div className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Terms</Label>
            <textarea
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#4F8CFF]/30"
              placeholder="Payment terms, warranty, scope exclusions"
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className="rounded-xl" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create {mode === 'invoice' ? 'Invoice' : 'Quotation'}
          </Button>
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
