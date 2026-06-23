'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface FinanceLineItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
  discount: string
  taxRate: string
  itemType: string
}

export interface FinanceTotals {
  subtotal: number
  discount: number
  taxAmount: number
  totalAmount: number
}

export function createEmptyLineItem(): FinanceLineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: '1',
    unitPrice: '',
    discount: '0',
    taxRate: '18',
    itemType: 'PRODUCT',
  }
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function calculateLineItem(item: FinanceLineItem) {
  const quantity = Math.max(0, toNumber(item.quantity))
  const unitPrice = Math.max(0, toNumber(item.unitPrice))
  const discountRate = Math.min(100, Math.max(0, toNumber(item.discount)))
  const taxRate = Math.max(0, toNumber(item.taxRate))
  const baseAmount = quantity * unitPrice
  const discountAmount = (baseAmount * discountRate) / 100
  const taxableAmount = Math.max(0, baseAmount - discountAmount)
  const taxAmount = (taxableAmount * taxRate) / 100

  return {
    baseAmount,
    discountAmount,
    taxAmount,
    total: taxableAmount + taxAmount,
  }
}

export function calculateFinanceTotals(items: FinanceLineItem[]): FinanceTotals {
  return items.reduce(
    (totals, item) => {
      const line = calculateLineItem(item)
      return {
        subtotal: totals.subtotal + line.baseAmount,
        discount: totals.discount + line.discountAmount,
        taxAmount: totals.taxAmount + line.taxAmount,
        totalAmount: totals.totalAmount + line.total,
      }
    },
    { subtotal: 0, discount: 0, taxAmount: 0, totalAmount: 0 },
  )
}

export function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

interface LineItemsEditorProps {
  items: FinanceLineItem[]
  onChange: (items: FinanceLineItem[]) => void
  showItemType?: boolean
}

export function LineItemsEditor({ items, onChange, showItemType = false }: LineItemsEditorProps) {
  const updateItem = (id: string, patch: Partial<FinanceLineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    onChange(items.filter((item) => item.id !== id))
  }

  const totals = calculateFinanceTotals(items)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-[#262626]">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-[#0A0A0A] text-[#52525B]">
            <tr>
              <th className="p-3 text-left font-medium">Description</th>
              {showItemType && <th className="p-3 text-left font-medium">Type</th>}
              <th className="w-24 p-3 text-right font-medium">Qty</th>
              <th className="w-32 p-3 text-right font-medium">Unit price</th>
              <th className="w-28 p-3 text-right font-medium">Disc %</th>
              <th className="w-28 p-3 text-right font-medium">Tax %</th>
              <th className="w-36 p-3 text-right font-medium">Line total</th>
              <th className="w-12 p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const line = calculateLineItem(item)

              return (
                <tr key={item.id} className="border-t border-[#262626]">
                  <td className="p-3">
                    <Input
                      value={item.description}
                      onChange={(event) => updateItem(item.id, { description: event.target.value })}
                      placeholder="Service, product, AMC item..."
                      className="h-9"
                    />
                  </td>
                  {showItemType && (
                    <td className="p-3">
                      <select
                        value={item.itemType}
                        onChange={(event) => updateItem(item.id, { itemType: event.target.value })}
                        className="h-9 w-full rounded-xl border border-[#262626] bg-[#111111] px-3 text-sm text-white focus:outline-none focus:border-[#4F8CFF]/30"
                      >
                        <option value="PRODUCT">Product</option>
                        <option value="SERVICE">Service</option>
                        <option value="AMC">AMC</option>
                        <option value="IMPLEMENTATION">Implementation</option>
                      </select>
                    </td>
                  )}
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                      className="h-9 text-right"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                      className="h-9 text-right"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount}
                      onChange={(event) => updateItem(item.id, { discount: event.target.value })}
                      className="h-9 text-right"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.taxRate}
                      onChange={(event) => updateItem(item.id, { taxRate: event.target.value })}
                      className="h-9 text-right"
                    />
                  </td>
                  <td className="p-3 text-right font-medium text-white">{formatMoney(line.total)}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="rounded-lg p-2 text-[#52525B] transition-colors hover:bg-[#171717] hover:text-[#EF4444] disabled:opacity-40"
                      aria-label="Remove line item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Button
          type="button"
          variant="secondary"
          className="w-fit rounded-xl"
          onClick={() => onChange([...items, createEmptyLineItem()])}
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>

        <div className="w-full rounded-2xl border border-[#262626] bg-[#111111] p-4 md:max-w-sm">
          <Label className="mb-3 block text-xs text-[#A1A1AA]">Totals</Label>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]">Subtotal</span>
              <span className="text-white">{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]">Discount</span>
              <span className="text-white">{formatMoney(totals.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A1A1AA]">Tax</span>
              <span className="text-white">{formatMoney(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-[#262626] pt-3 text-base font-semibold">
              <span className="text-white">Grand total</span>
              <span className="text-[#22C55E]">{formatMoney(totals.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
