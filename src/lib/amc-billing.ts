import type { AmcImportRow } from './amc-excel-parser'

export const FISCAL_YEAR_26_27 = '2026-27'

export const QUARTER_LABELS: Record<number, string> = {
  1: 'Q1 (Apr–Jun)',
  2: 'Q2 (Jul–Sep)',
  3: 'Q3 (Oct–Dec)',
  4: 'Q4 (Jan–Mar)',
}

export const QUARTER_DUE_DATES: Record<number, string> = {
  1: '2026-06-30',
  2: '2026-09-30',
  3: '2026-12-31',
  4: '2027-03-31',
}

export type LineItemInput = {
  categoryName: string
  label?: string
  rateYearly: number
  rateQuarterly: number
  qtyQ1: number
  qtyQ2: number
  qtyQ3: number
  qtyQ4: number
  includeInEmi: boolean
  addons?: {
    name: string
    rateYearly: number
    rateQuarterly: number
    quantity: number
    includeInEmi: boolean
  }[]
}

export function quarterQty(item: LineItemInput, quarter: 1 | 2 | 3 | 4): number {
  if (quarter === 1) return item.qtyQ1
  if (quarter === 2) return item.qtyQ2
  if (quarter === 3) return item.qtyQ3
  return item.qtyQ4
}

/** Per-quarter line contribution (qty × quarterly rate + addons). */
export function lineQuarterAmount(item: LineItemInput, quarter: 1 | 2 | 3 | 4): number {
  if (!item.includeInEmi) return 0
  const qty = quarterQty(item, quarter)
  let total = qty * item.rateQuarterly
  for (const addon of item.addons ?? []) {
    if (!addon.includeInEmi) continue
    total += addon.quantity * addon.rateQuarterly
  }
  return total
}

export function computedQuarterTotal(items: LineItemInput[], quarter: 1 | 2 | 3 | 4): number {
  return items.reduce((sum, item) => sum + lineQuarterAmount(item, quarter), 0)
}

export function lineItemsFromImportRow(row: AmcImportRow): LineItemInput[] {
  const items: LineItemInput[] = []

  const serverAddons =
    row.sophosQuantity > 0
      ? [{
          name: 'Sophos Firewall',
          rateYearly: row.sophosRateYearly,
          rateQuarterly: row.sophosRateQuarterly,
          quantity: row.sophosQuantity,
          includeInEmi: false,
        }]
      : []

  if (
    row.serverRateYearly > 0 ||
    row.serverQtyQ1 + row.serverQtyQ2 + row.serverQtyQ3 + row.serverQtyQ4 > 0 ||
    serverAddons.length > 0
  ) {
    items.push({
      categoryName: 'Server',
      label: 'Server',
      rateYearly: row.serverRateYearly,
      rateQuarterly: row.serverRateQuarterly,
      qtyQ1: row.serverQtyQ1,
      qtyQ2: row.serverQtyQ2,
      qtyQ3: row.serverQtyQ3,
      qtyQ4: row.serverQtyQ4,
      includeInEmi: false,
      addons: serverAddons,
    })
  }

  if (
    row.thinClientRateYearly > 0 ||
    row.thinClientQtyQ1 + row.thinClientQtyQ2 + row.thinClientQtyQ3 + row.thinClientQtyQ4 > 0
  ) {
    items.push({
      categoryName: 'Thin Client',
      label: 'Thin Client',
      rateYearly: row.thinClientRateYearly,
      rateQuarterly: row.thinClientRateQuarterly,
      qtyQ1: row.thinClientQtyQ1,
      qtyQ2: row.thinClientQtyQ2,
      qtyQ3: row.thinClientQtyQ3,
      qtyQ4: row.thinClientQtyQ4,
      includeInEmi: true,
    })
  }

  if (
    row.laptopDesktopRateYearly > 0 ||
    row.laptopDesktopQtyQ1 + row.laptopDesktopQtyQ2 + row.laptopDesktopQtyQ3 + row.laptopDesktopQtyQ4 > 0
  ) {
    items.push({
      categoryName: 'Laptop + Desktop',
      label: 'Laptop + Desktop',
      rateYearly: row.laptopDesktopRateYearly,
      rateQuarterly: row.laptopDesktopRateQuarterly,
      qtyQ1: row.laptopDesktopQtyQ1,
      qtyQ2: row.laptopDesktopQtyQ2,
      qtyQ3: row.laptopDesktopQtyQ3,
      qtyQ4: row.laptopDesktopQtyQ4,
      includeInEmi: true,
    })
  }

  return items
}

export function categoryLabel(name: string): string {
  return name
}

export function formatCurrency(amount: number | string): string {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function hasQuarterlyAmounts(amounts: number[]): boolean {
  return amounts.some((a) => a > 0)
}
