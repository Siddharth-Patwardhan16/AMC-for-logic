'use client'

import { Fragment, useState } from 'react'
import { CheckCircle2, Clock, IndianRupee, Loader2, Plus, Settings2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/components/providers'
import { categoryLabel, formatCurrency, lineQuarterAmount, type LineItemInput } from '@/lib/amc-billing'
import { quarterPaymentStatus } from '@/lib/amc-payment-utils'
import { QuarterStatusBadge } from '@/components/finance/quarter-status'
import { CompanyBadge } from '@/components/company/company-selector'

type Schedule = {
  id: string
  fiscalYear: string
  section: string | null
  enableQuarterlySplit: boolean
  yearlyAmount: unknown
  quarterlyTotal: unknown
  amountQ1: unknown
  amountQ2: unknown
  amountQ3: unknown
  amountQ4: unknown
  company?: { id: string; name: string } | null
  lineItems: {
    id: string
    categoryName: string
    label: string | null
    rateYearly: unknown
    rateQuarterly: unknown
    qtyQ1: number
    qtyQ2: number
    qtyQ3: number
    qtyQ4: number
    includeInEmi: boolean
    addons: {
      id: string
      name: string
      rateYearly: unknown
      rateQuarterly: unknown
      quantity: number
      includeInEmi: boolean
    }[]
  }[]
  installments: {
    id: string
    quarter: number
    label: string
    dueDate: Date | string
    amount: unknown
    paidAmount: unknown
    status: string
    payments: {
      id: string
      amount: unknown
      paymentDate: Date | string
      paymentMode: string
      reference: string | null
    }[]
  }[]
}

function lineItemAsInput(item: Schedule['lineItems'][0]): LineItemInput {
  return {
    categoryName: item.categoryName,
    label: item.label ?? undefined,
    rateYearly: Number(item.rateYearly),
    rateQuarterly: Number(item.rateQuarterly),
    qtyQ1: item.qtyQ1,
    qtyQ2: item.qtyQ2,
    qtyQ3: item.qtyQ3,
    qtyQ4: item.qtyQ4,
    includeInEmi: item.includeInEmi,
    addons: item.addons.map((a) => ({
      name: a.name,
      rateYearly: Number(a.rateYearly),
      rateQuarterly: Number(a.rateQuarterly),
      quantity: a.quantity,
      includeInEmi: a.includeInEmi,
    })),
  }
}

function PaymentForm({ installmentId, onDone }: { installmentId: string; onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const payMutation = trpc.amcSchedule.recordInstallmentPayment.useMutation({
    onSuccess: () => {
      toast.success('Payment recorded')
      onDone()
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="flex flex-wrap items-end gap-2 mt-3 p-3 rounded-xl bg-[#0A0A0A] border border-[#262626]">
      <div>
        <label className="text-[10px] text-[#52525B] block mb-1">Amount</label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-8 w-28 text-xs" />
      </div>
      <div>
        <label className="text-[10px] text-[#52525B] block mb-1">Reference</label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / Cheque #" className="h-8 w-36 text-xs" />
      </div>
      <Button size="sm" className="h-8 rounded-lg text-xs" disabled={payMutation.isPending || !amount}
        onClick={() => payMutation.mutate({ installmentId, amount: Number(amount), reference: reference || undefined })}>
        {payMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Record'}
      </Button>
    </div>
  )
}

function CreateScheduleForm({ customerId, companyId, onDone }: { customerId: string; companyId: string; onDone: () => void }) {
  const [fiscalYear, setFiscalYear] = useState('2026-27')
  const [enableQuarterlySplit, setEnableQuarterlySplit] = useState(false)
  const [yearlyAmount, setYearlyAmount] = useState('')

  const createMutation = trpc.amcSchedule.create.useMutation({
    onSuccess: () => { toast.success('Billing schedule created'); onDone() },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="p-5 rounded-2xl bg-[#111111] border border-[#262626] text-left max-w-md mx-auto">
      <h3 className="text-sm font-semibold text-white mb-4">Create billing schedule</h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-[#A1A1AA]">Fiscal year</Label>
          <Input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="2026-27" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-[#A1A1AA]">Yearly amount (optional)</Label>
          <Input type="number" value={yearlyAmount} onChange={(e) => setYearlyAmount(e.target.value)} placeholder="0" className="mt-1" />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#A1A1AA] cursor-pointer">
          <input type="checkbox" checked={enableQuarterlySplit} onChange={(e) => setEnableQuarterlySplit(e.target.checked)}
            className="rounded border-[#262626]" />
          Split into 4 quarterly payments
        </label>
        <Button className="w-full rounded-xl" disabled={createMutation.isPending}
          onClick={() => createMutation.mutate({
            customerId,
            companyId,
            fiscalYear,
            enableQuarterlySplit,
            yearlyAmount: yearlyAmount ? Number(yearlyAmount) : undefined,
            amountQ1: yearlyAmount && enableQuarterlySplit ? Number(yearlyAmount) / 4 : 0,
            amountQ2: yearlyAmount && enableQuarterlySplit ? Number(yearlyAmount) / 4 : 0,
            amountQ3: yearlyAmount && enableQuarterlySplit ? Number(yearlyAmount) / 4 : 0,
            amountQ4: yearlyAmount && enableQuarterlySplit ? Number(yearlyAmount) / 4 : 0,
            useAutoQuarterlyAmounts: false,
          })}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create schedule'}
        </Button>
      </div>
    </div>
  )
}

function AddLineItemForm({ scheduleId, companyId, onDone }: { scheduleId: string; companyId: string; onDone: () => void }) {
  const [categoryName, setCategoryName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [rateYearly, setRateYearly] = useState('')
  const [rateQuarterly, setRateQuarterly] = useState('')
  const [qty, setQty] = useState('0')
  const [includeInEmi, setIncludeInEmi] = useState(true)
  const [addonName, setAddonName] = useState('')
  const [addonRate, setAddonRate] = useState('')

  const { data: categories } = trpc.amcSchedule.listCategories.useQuery({ companyId })
  const createCategory = trpc.amcSchedule.createCategory.useMutation({
    onSuccess: (cat) => { setCategoryName(cat.name); setNewCategory(''); toast.success('Category created') },
    onError: (e) => toast.error(e.message),
  })
  const addLineItem = trpc.amcSchedule.addLineItem.useMutation({
    onSuccess: () => { toast.success('Line item added'); onDone() },
    onError: (e) => toast.error(e.message),
  })

  const selectedCategory = categoryName || newCategory

  return (
    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] mb-4">
      <h4 className="text-sm font-medium text-white mb-3">Add category / line item</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-[#52525B]">Category</Label>
          <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
            className="w-full h-9 mt-1 px-2 rounded-lg bg-[#111111] border border-[#262626] text-sm text-white">
            <option value="">— Select or create new —</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Or new category name</Label>
          <div className="flex gap-2 mt-1">
            <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. CCTV" className="h-9 text-sm" />
            <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0"
              disabled={!newCategory.trim() || createCategory.isPending}
              onClick={() => createCategory.mutate({ companyId, name: newCategory.trim(), defaultIncludeInEmi: includeInEmi })}>
              Add
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Rate / year</Label>
          <Input type="number" value={rateYearly} onChange={(e) => setRateYearly(e.target.value)} className="h-9 mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Rate / quarter</Label>
          <Input type="number" value={rateQuarterly} onChange={(e) => setRateQuarterly(e.target.value)} className="h-9 mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-[#52525B]">Qty (all quarters)</Label>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-9 mt-1 text-sm" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer pb-2">
            <input type="checkbox" checked={includeInEmi} onChange={(e) => setIncludeInEmi(e.target.checked)} />
            Include in quarterly EMI
          </label>
        </div>
        <div className="md:col-span-2 border-t border-[#262626] pt-3">
          <Label className="text-xs text-[#52525B]">Add-on service (optional)</Label>
          <div className="flex gap-2 mt-1">
            <Input value={addonName} onChange={(e) => setAddonName(e.target.value)} placeholder="e.g. Sophos Firewall" className="h-9 text-sm flex-1" />
            <Input type="number" value={addonRate} onChange={(e) => setAddonRate(e.target.value)} placeholder="Rate/qtr" className="h-9 text-sm w-24" />
          </div>
        </div>
      </div>
      <Button className="mt-3 rounded-lg text-xs" size="sm" disabled={!selectedCategory || addLineItem.isPending}
        onClick={() => {
          const q = Number(qty) || 0
          const yearly = Number(rateYearly) || 0
          const quarterly = Number(rateQuarterly) || (yearly / 4)
          addLineItem.mutate({
            scheduleId,
            companyId,
            categoryName: selectedCategory,
            rateYearly: yearly,
            rateQuarterly: quarterly,
            qtyQ1: q, qtyQ2: q, qtyQ3: q, qtyQ4: q,
            includeInEmi,
            addons: addonName ? [{
              name: addonName,
              rateYearly: Number(addonRate) * 4 || 0,
              rateQuarterly: Number(addonRate) || 0,
              quantity: 1,
              includeInEmi: false,
            }] : [],
          })
        }}>
        {addLineItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
        Add line item
      </Button>
    </div>
  )
}

function ScheduleCard({
  schedule,
  companyId,
  customerId,
  onRefresh,
}: {
  schedule: Schedule
  companyId: string
  customerId: string
  onRefresh: () => void
}) {
  const [showAddLine, setShowAddLine] = useState(false)
  const [payingQuarter, setPayingQuarter] = useState<string | null>(null)

  const updateMutation = trpc.amcSchedule.update.useMutation({
    onSuccess: () => { toast.success('Schedule updated'); onRefresh() },
    onError: (e) => toast.error(e.message),
  })
  const deleteLineMutation = trpc.amcSchedule.deleteLineItem.useMutation({
    onSuccess: () => { toast.success('Removed'); onRefresh() },
    onError: (e) => toast.error(e.message),
  })

  const quarterAmounts = [
    Number(schedule.amountQ1),
    Number(schedule.amountQ2),
    Number(schedule.amountQ3),
    Number(schedule.amountQ4),
  ]

  return (
    <div className="rounded-2xl border border-[#262626] overflow-hidden">
      <div className="px-5 py-4 bg-[#111111] border-b border-[#262626] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">FY {schedule.fiscalYear}</h3>
                <p className="text-xs text-[#52525B] mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{schedule.section ?? 'AMC'} · Yearly {formatCurrency(Number(schedule.yearlyAmount))}</span>
                  {schedule.company?.name && <CompanyBadge name={schedule.company.name} />}
                  {schedule.enableQuarterlySplit && <span>· 4 quarterly EMIs</span>}
                </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enableQuarterlySplit}
              onChange={(e) => updateMutation.mutate({
                id: schedule.id,
                enableQuarterlySplit: e.target.checked,
                useAutoQuarterlyAmounts: true,
              })}
              className="rounded border-[#262626]"
            />
            <Settings2 className="h-3 w-3" />
            Quarterly split
          </label>
          <div className="text-right">
            <p className="text-lg font-bold text-[#22C55E]">{formatCurrency(Number(schedule.yearlyAmount))}</p>
            <p className="text-[10px] text-[#52525B]">GST extra</p>
          </div>
        </div>
      </div>

      {showAddLine ? (
        <div className="p-4 border-b border-[#262626]">
          <AddLineItemForm scheduleId={schedule.id} companyId={companyId} onDone={() => { setShowAddLine(false); onRefresh() }} />
        </div>
      ) : (
        <div className="px-4 py-2 border-b border-[#262626]">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAddLine(true)}>
            <Plus className="h-3 w-3 mr-1" /> Add category / line item
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-[#0A0A0A] text-[#52525B] uppercase tracking-wide">
              <th className="text-left p-3 border-b border-[#262626]">Category</th>
              <th className="text-right p-3 border-b border-[#262626]">Rate / yr</th>
              <th className="text-right p-3 border-b border-[#262626]">Rate / qtr</th>
              <th className="text-center p-3 border-b border-[#262626]">Q1 qty</th>
              <th className="text-center p-3 border-b border-[#262626]">Q2 qty</th>
              <th className="text-center p-3 border-b border-[#262626]">Q3 qty</th>
              <th className="text-center p-3 border-b border-[#262626]">Q4 qty</th>
              {schedule.enableQuarterlySplit && (
                <>
                  <th className="text-right p-3 border-b border-[#262626]">Q1 amt</th>
                  <th className="text-right p-3 border-b border-[#262626]">Q2 amt</th>
                  <th className="text-right p-3 border-b border-[#262626]">Q3 amt</th>
                  <th className="text-right p-3 border-b border-[#262626]">Q4 amt</th>
                </>
              )}
              <th className="p-3 border-b border-[#262626]" />
            </tr>
          </thead>
          <tbody>
            {schedule.lineItems.length === 0 && (
              <tr><td colSpan={12} className="p-6 text-center text-[#52525B]">No line items — add categories above</td></tr>
            )}
            {schedule.lineItems.map((item) => (
              <Fragment key={item.id}>
                <tr className="border-b border-[#1a1a1a]">
                  <td className="p-3 text-white font-medium">
                    {item.label ?? categoryLabel(item.categoryName)}
                    {!item.includeInEmi && <span className="ml-2 text-[10px] text-[#52525B]">(tracked only)</span>}
                  </td>
                  <td className="p-3 text-right text-[#A1A1AA]">{formatCurrency(Number(item.rateYearly))}</td>
                  <td className="p-3 text-right text-[#A1A1AA]">{formatCurrency(Number(item.rateQuarterly))}</td>
                  <td className="p-3 text-center text-white">{item.qtyQ1 || '—'}</td>
                  <td className="p-3 text-center text-white">{item.qtyQ2 || '—'}</td>
                  <td className="p-3 text-center text-white">{item.qtyQ3 || '—'}</td>
                  <td className="p-3 text-center text-white">{item.qtyQ4 || '—'}</td>
                  {schedule.enableQuarterlySplit && ([1, 2, 3, 4] as const).map((q) => {
                    const amt = lineQuarterAmount(lineItemAsInput(item), q)
                    return (
                    <td key={q} className={`p-3 text-right ${item.includeInEmi ? 'text-[#22C55E]' : 'text-[#52525B]'}`}>
                      {amt > 0 ? formatCurrency(amt) : '—'}
                    </td>
                    )
                  })}
                  <td className="p-3">
                    <button type="button" onClick={() => deleteLineMutation.mutate({ id: item.id })}
                      className="text-[#52525B] hover:text-[#EF4444]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
                {item.addons.map((addon) => (
                  <tr key={addon.id} className="border-b border-[#1a1a1a] bg-[#0A0A0A]/50">
                    <td className="p-3 pl-8 text-[#A1A1AA]">
                      <Plus className="inline h-3 w-3 mr-1 text-[#4F8CFF]" />
                      {addon.name} × {addon.quantity}
                      {!addon.includeInEmi && <span className="ml-1 text-[10px] text-[#52525B]">(add-on)</span>}
                    </td>
                    <td className="p-3 text-right text-[#52525B]">{formatCurrency(Number(addon.rateYearly))}</td>
                    <td className="p-3 text-right text-[#52525B]">{formatCurrency(Number(addon.rateQuarterly))}</td>
                    <td colSpan={schedule.enableQuarterlySplit ? 9 : 5} className="p-3 text-[#52525B]">Sub-service under {item.categoryName}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {schedule.enableQuarterlySplit && schedule.lineItems.length > 0 && (
              <>
                <tr className="bg-[#111111] font-semibold">
                  <td colSpan={7} className="p-3 text-white">Quarterly EMI (Net amount)</td>
                  {quarterAmounts.map((amt, i) => (
                    <td key={i} className="p-3 text-right text-[#22C55E]">{formatCurrency(amt)}</td>
                  ))}
                  <td />
                </tr>
                <tr className="bg-[#111111]">
                  <td colSpan={7} className="p-3 text-[#A1A1AA]">Yearly total</td>
                  <td colSpan={4} className="p-3 text-right text-white font-bold">{formatCurrency(Number(schedule.yearlyAmount))}</td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {schedule.enableQuarterlySplit && schedule.installments.length > 0 && (
        <div className="p-5 bg-[#111111] border-t border-[#262626]">
          <h4 className="text-sm font-semibold text-white mb-4">Quarterly Payments (4 EMIs)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedule.installments.map((inst) => {
              const paid = Number(inst.paidAmount)
              const total = Number(inst.amount)
              const remaining = Math.max(0, total - paid)
              const status = quarterPaymentStatus(total, paid, inst.dueDate)

              return (
                <div key={inst.id} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{inst.label}</p>
                      <p className="text-[10px] text-[#52525B]">Due {new Date(inst.dueDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <QuarterStatusBadge status={status} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-bold text-white">{formatCurrency(total)}</span>
                    {paid > 0 && (
                      <span className="text-xs text-[#22C55E]">
                        {paid >= total ? 'Fully paid' : `${formatCurrency(paid)} paid · ${formatCurrency(remaining)} due`}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-[#171717] overflow-hidden mb-3">
                    <div className="h-full bg-[#22C55E] rounded-full transition-all" style={{ width: `${Math.min(100, total > 0 ? (paid / total) * 100 : 0)}%` }} />
                  </div>
                  {inst.payments.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wide">Payment history</p>
                      {inst.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-[#A1A1AA] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                            {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                            {p.reference && <span className="text-[#52525B]">· {p.reference}</span>}
                          </span>
                          <span className="text-white">{formatCurrency(Number(p.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {status !== 'PAID' && (
                    payingQuarter === inst.id ? (
                      <PaymentForm installmentId={inst.id} onDone={() => { setPayingQuarter(null); onRefresh() }} />
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg border border-[#262626]"
                        onClick={() => setPayingQuarter(inst.id)}>
                        <Clock className="h-3 w-3 mr-1" /> Record payment
                      </Button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function AmcBillingPanel({
  customerId,
  companyId,
  schedules,
}: {
  customerId: string
  companyId: string
  schedules: Schedule[]
}) {
  const utils = trpc.useUtils()
  const [showCreate, setShowCreate] = useState(false)

  const refresh = () => {
    utils.customer.get.invalidate({ id: customerId })
    utils.amcSchedule.getByCustomer.invalidate({ customerId })
  }

  if (!schedules.length) {
    return (
      <div className="p-8 rounded-2xl bg-[#111111] border border-[#262626] text-center">
        <IndianRupee className="h-8 w-8 text-[#52525B] mx-auto mb-3" />
        <p className="text-sm text-[#A1A1AA]">No billing schedule yet</p>
        <p className="text-xs text-[#52525B] mt-1 mb-4">Create manually, import from Excel, or track yearly billing only</p>
        {showCreate ? (
          <CreateScheduleForm customerId={customerId} companyId={companyId} onDone={() => { setShowCreate(false); refresh() }} />
        ) : (
          <Button className="rounded-xl" onClick={() => setShowCreate(true)}>Create schedule</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.id}
          schedule={schedule}
          companyId={companyId}
          customerId={customerId}
          onRefresh={refresh}
        />
      ))}
    </div>
  )
}
