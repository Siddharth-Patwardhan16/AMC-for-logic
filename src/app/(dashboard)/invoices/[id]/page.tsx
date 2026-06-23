'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, FileText, Loader2, Receipt, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers'
import { formatMoney } from '@/components/finance/line-items-editor'

const invoiceStatuses = ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']
const paymentModes = ['BANK_TRANSFER', 'UPI', 'CHEQUE', 'CASH', 'CARD', 'ONLINE']

function badgeVariant(status: string) {
  if (status === 'PAID') return 'success' as const
  if (status === 'OVERDUE' || status === 'CANCELLED') return 'destructive' as const
  if (status === 'PARTIAL') return 'warning' as const
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

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = String(params.id)
  const utils = trpc.useUtils()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const { data: invoice, isLoading } = trpc.invoice.get.useQuery({ id })

  const updateInvoice = trpc.invoice.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.invoice.get.invalidate({ id }),
        utils.invoice.list.invalidate(),
        utils.customer.get.invalidate({ id: invoice?.customerId ?? '' }),
      ])
      toast.success('Invoice updated')
    },
    onError: (error) => toast.error(error.message),
  })

  const recordPayment = trpc.payment.recordForInvoice.useMutation({
    onSuccess: async () => {
      setPaymentAmount('')
      setPaymentReference('')
      setPaymentNotes('')
      await Promise.all([
        utils.invoice.get.invalidate({ id }),
        utils.invoice.list.invalidate(),
        utils.dashboard.stats.invalidate(),
        utils.dashboard.revenueChart.invalidate(),
        utils.customer.get.invalidate({ id: invoice?.customerId ?? '' }),
      ])
      toast.success('Payment recorded')
    },
    onError: (error) => toast.error(error.message),
  })

  if (isLoading || !invoice) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F8CFF] border-t-transparent" />
      </div>
    )
  }

  const totalAmount = Number(invoice.totalAmount)
  const paidAmount = Number(invoice.paidAmount)
  const outstanding = Math.max(0, totalAmount - paidAmount)
  const canRecordPayment = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && outstanding > 0

  const submitPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(paymentAmount)

    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }

    recordPayment.mutate({
      invoiceId: invoice.id,
      amount,
      paymentMode: paymentMode as 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'ONLINE',
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-[1200px] p-5 lg:p-8">
      <Link href="/invoices" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F8CFF]/10">
            <Receipt className="h-6 w-6 text-[#4F8CFF]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{invoice.invoiceNumber}</h1>
              <Badge variant={badgeVariant(invoice.status)}>{invoice.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              {invoice.customer?.name} · Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={invoice.status}
            onChange={(event) => updateInvoice.mutate({ id: invoice.id, status: event.target.value })}
            disabled={updateInvoice.isPending}
            className="h-10 rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
          >
            {invoiceStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Link href={`/customers/${invoice.customerId}`}>
            <Button variant="secondary" className="rounded-xl">Customer</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Subtotal', Number(invoice.subtotal)],
          ['Tax', Number(invoice.taxAmount)],
          ['Paid', paidAmount],
          ['Outstanding', outstanding],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
            <p className="text-xs uppercase tracking-wide text-[#52525B]">{label}</p>
            <p className="mt-2 text-lg font-bold text-white">{formatMoney(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#262626] bg-[#111111]">
            <div className="border-b border-[#262626] px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Line items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[#0A0A0A] text-[#52525B]">
                  <tr>
                    <th className="p-3 text-left font-medium">Description</th>
                    <th className="p-3 text-right font-medium">Qty</th>
                    <th className="p-3 text-right font-medium">Unit</th>
                    <th className="p-3 text-right font-medium">Disc %</th>
                    <th className="p-3 text-right font-medium">Tax %</th>
                    <th className="p-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-[#262626]">
                      <td className="p-3 text-white">{item.description}</td>
                      <td className="p-3 text-right text-[#A1A1AA]">{item.quantity}</td>
                      <td className="p-3 text-right text-[#A1A1AA]">{formatMoney(Number(item.unitPrice))}</td>
                      <td className="p-3 text-right text-[#A1A1AA]">{Number(item.discount).toLocaleString('en-IN')}</td>
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
                <p className="whitespace-pre-wrap text-sm text-[#A1A1AA]">{invoice.notes || 'No notes'}</p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#52525B]">Terms</p>
                <p className="whitespace-pre-wrap text-sm text-[#A1A1AA]">{invoice.terms || 'No terms'}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Payments</h2>
              <Badge variant={outstanding > 0 ? 'warning' : 'success'}>
                {outstanding > 0 ? 'Open' : 'Settled'}
              </Badge>
            </div>

            {invoice.payments.length > 0 ? (
              <div className="mb-4 space-y-2">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                        {formatDate(payment.paymentDate)}
                      </span>
                      <span className="text-sm font-semibold text-white">{formatMoney(Number(payment.amount))}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#52525B]">
                      {payment.paymentMode.replace('_', ' ')}
                      {payment.reference ? ` · ${payment.reference}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-[#52525B]">No payments recorded yet.</p>
            )}

            {canRecordPayment && (
              <form onSubmit={submitPayment} className="space-y-3 border-t border-[#262626] pt-4">
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    max={outstanding}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder={String(outstanding)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Mode</Label>
                  <select
                    value={paymentMode}
                    onChange={(event) => setPaymentMode(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
                  >
                    {paymentModes.map((modeOption) => (
                      <option key={modeOption} value={modeOption}>{modeOption.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Reference</Label>
                  <Input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="UTR / cheque / receipt" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-[#A1A1AA]">Notes</Label>
                  <Input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Optional" />
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={recordPayment.isPending}>
                  {recordPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Record payment
                </Button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Documents</h2>
            {invoice.documents.length > 0 ? (
              <div className="space-y-2">
                {invoice.documents.map((document) => (
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
