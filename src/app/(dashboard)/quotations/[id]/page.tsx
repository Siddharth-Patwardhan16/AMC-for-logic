'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers'
import { formatMoney } from '@/components/finance/line-items-editor'

const quotationStatuses = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED']

function badgeVariant(status: string) {
  if (status === 'APPROVED') return 'success' as const
  if (status === 'REJECTED' || status === 'EXPIRED') return 'destructive' as const
  if (status === 'CONVERTED') return 'info' as const
  return 'default' as const
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function inputDate(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)
  const utils = trpc.useUtils()
  const [invoiceDueDate, setInvoiceDueDate] = useState(inputDate(30))

  const { data: quotation, isLoading } = trpc.quotation.get.useQuery({ id })

  const updateQuotation = trpc.quotation.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.quotation.get.invalidate({ id }),
        utils.quotation.list.invalidate(),
        utils.customer.get.invalidate({ id: quotation?.customerId ?? '' }),
      ])
      toast.success('Quotation updated')
    },
    onError: (error) => toast.error(error.message),
  })

  const convertToInvoice = trpc.quotation.convertToInvoice.useMutation({
    onSuccess: async (invoice) => {
      await Promise.all([
        utils.quotation.get.invalidate({ id }),
        utils.quotation.list.invalidate(),
        utils.invoice.list.invalidate(),
        utils.customer.get.invalidate({ id: quotation?.customerId ?? '' }),
      ])
      toast.success('Invoice created from quotation')
      router.push(`/invoices/${invoice.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  if (isLoading || !quotation) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F8CFF] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] p-5 lg:p-8">
      <Link href="/quotations" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Quotations
      </Link>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06B6D4]/10">
            <FileText className="h-6 w-6 text-[#06B6D4]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{quotation.quotationNumber}</h1>
              <Badge variant={badgeVariant(quotation.status)}>{quotation.status}</Badge>
              <Badge variant="outline">v{quotation.version}</Badge>
            </div>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              {quotation.customer?.name} · Valid until {formatDate(quotation.validUntil)}
              {quotation.createdBy?.name && ` · Created by ${quotation.createdBy.name}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={quotation.status}
            onChange={(event) => updateQuotation.mutate({ id: quotation.id, status: event.target.value })}
            disabled={updateQuotation.isPending || quotation.status === 'CONVERTED'}
            className="h-10 rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30 disabled:opacity-60"
          >
            {quotationStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Link href={`/customers/${quotation.customerId}`}>
            <Button variant="secondary" className="rounded-xl">Customer</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Subtotal', Number(quotation.subtotal)],
          ['Discount', Number(quotation.discount)],
          ['Tax', Number(quotation.taxAmount)],
          ['Grand total', Number(quotation.totalAmount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
            <p className="text-xs uppercase tracking-wide text-[#52525B]">{label}</p>
            <p className="mt-2 text-lg font-bold text-white">{formatMoney(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#262626] bg-[#111111]">
            <div className="border-b border-[#262626] px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Quoted items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-[#0A0A0A] text-[#52525B]">
                  <tr>
                    <th className="p-3 text-left font-medium">Description</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-right font-medium">Qty</th>
                    <th className="p-3 text-right font-medium">Unit</th>
                    <th className="p-3 text-right font-medium">Tax %</th>
                    <th className="p-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item) => (
                    <tr key={item.id} className="border-t border-[#262626]">
                      <td className="p-3 text-white">{item.description}</td>
                      <td className="p-3 text-[#A1A1AA]">{item.itemType}</td>
                      <td className="p-3 text-right text-[#A1A1AA]">{item.quantity}</td>
                      <td className="p-3 text-right text-[#A1A1AA]">{formatMoney(Number(item.unitPrice))}</td>
                      <td className="p-3 text-right text-[#A1A1AA]">{Number(item.taxRate).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-medium text-white">{formatMoney(Number(item.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Notes & terms</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#52525B]">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-[#A1A1AA]">{quotation.notes || 'No notes'}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#52525B]">Terms</p>
                <p className="whitespace-pre-wrap text-sm text-[#A1A1AA]">{quotation.terms || 'No terms'}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#4F8CFF]" />
              <h2 className="text-sm font-semibold text-white">Convert to invoice</h2>
            </div>
            {quotation.status === 'CONVERTED' ? (
              <p className="text-sm text-[#A1A1AA]">This quotation has already been converted.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Invoice due date</Label>
                  <Input type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} />
                </div>
                <Button
                  className="w-full rounded-xl"
                  disabled={convertToInvoice.isPending}
                  onClick={() => convertToInvoice.mutate({ id: quotation.id, dueDate: invoiceDueDate })}
                >
                  {convertToInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  Create invoice
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Documents</h2>
            {quotation.documents.length > 0 ? (
              <div className="space-y-2">
                {quotation.documents.map((document) => (
                  <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-sm text-white hover:border-[#333333]">
                    <FileText className="h-4 w-4 text-[#A1A1AA]" />
                    <span className="truncate">{document.name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#52525B]">No documents attached.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
