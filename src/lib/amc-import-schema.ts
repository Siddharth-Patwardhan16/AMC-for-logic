import { z } from 'zod'

/** Canonical AMC Working 26-27 row — shared by Excel import and manual entry. */
export const amcImportRowSchema = z.object({
  srNo: z.number().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  companyLabel: z.string(),
  location: z.string(),
  serverRateYearly: z.number(),
  serverRateQuarterly: z.number(),
  sophosQuantity: z.number(),
  sophosRateYearly: z.number(),
  sophosRateQuarterly: z.number(),
  serverQtyQ1: z.number(),
  serverQtyQ2: z.number(),
  serverQtyQ3: z.number(),
  serverQtyQ4: z.number(),
  thinClientRateYearly: z.number(),
  thinClientRateQuarterly: z.number(),
  thinClientQtyQ1: z.number(),
  thinClientQtyQ2: z.number(),
  thinClientQtyQ3: z.number(),
  thinClientQtyQ4: z.number(),
  laptopDesktopRateYearly: z.number(),
  laptopDesktopRateQuarterly: z.number(),
  laptopDesktopQtyQ1: z.number(),
  laptopDesktopQtyQ2: z.number(),
  laptopDesktopQtyQ3: z.number(),
  laptopDesktopQtyQ4: z.number(),
  amountQ1: z.number(),
  amountQ2: z.number(),
  amountQ3: z.number(),
  amountQ4: z.number(),
  quarterlyTotal: z.number(),
  yearlyAmount: z.number(),
  section: z.string().optional(),
})

export type AmcImportRow = z.infer<typeof amcImportRowSchema>

export const AMC_SECTION_OPTIONS = [
  'AMC Q1',
  'Monthly Bill',
  'Computerwala',
  'Yearly AMC',
] as const

/** Default column indices for AMC Working 26-27 (Q1 sheet, row 3 headers). */
export const AMC_DEFAULT_COLUMN_MAP = {
  srNo: 0,
  name: 1,
  description: 2,
  company: 3,
  location: 4,
  serverRateYearly: 5,
  sophosFirewall: 6,
  serverRateQuarterly: 7,
  serverQtyQ1: 8,
  serverQtyQ2: 9,
  serverQtyQ3: 10,
  serverQtyQ4: 11,
  thinClientRateYearly: 12,
  thinClientRateQuarterly: 13,
  thinClientQtyQ1: 14,
  thinClientQtyQ2: 15,
  thinClientQtyQ3: 16,
  thinClientQtyQ4: 17,
  laptopDesktopRateYearly: 18,
  laptopDesktopRateQuarterly: 19,
  laptopDesktopQtyQ1: 20,
  laptopDesktopQtyQ2: 21,
  laptopDesktopQtyQ3: 22,
  laptopDesktopQtyQ4: 23,
  amountQ1: 24,
  amountQ2: 25,
  amountQ3: 26,
  amountQ4: 27,
  quarterlyTotal: 28,
  yearlyAmount: 29,
}

export type AmcColumnMap = typeof AMC_DEFAULT_COLUMN_MAP

export const EMPTY_AMC_ROW: Omit<AmcImportRow, 'name' | 'companyLabel' | 'location'> = {
  srNo: null,
  description: undefined,
  serverRateYearly: 0,
  serverRateQuarterly: 0,
  sophosQuantity: 0,
  sophosRateYearly: 0,
  sophosRateQuarterly: 0,
  serverQtyQ1: 0,
  serverQtyQ2: 0,
  serverQtyQ3: 0,
  serverQtyQ4: 0,
  thinClientRateYearly: 0,
  thinClientRateQuarterly: 0,
  thinClientQtyQ1: 0,
  thinClientQtyQ2: 0,
  thinClientQtyQ3: 0,
  thinClientQtyQ4: 0,
  laptopDesktopRateYearly: 0,
  laptopDesktopRateQuarterly: 0,
  laptopDesktopQtyQ1: 0,
  laptopDesktopQtyQ2: 0,
  laptopDesktopQtyQ3: 0,
  laptopDesktopQtyQ4: 0,
  amountQ1: 0,
  amountQ2: 0,
  amountQ3: 0,
  amountQ4: 0,
  quarterlyTotal: 0,
  yearlyAmount: 0,
  section: 'AMC Q1',
}

export function emptyAmcRowDefaults(): typeof EMPTY_AMC_ROW {
  return { ...EMPTY_AMC_ROW }
}

/** True when row has real billing or asset data (not an empty template line). */
export function isImportableDataRow(row: AmcImportRow): boolean {
  const normalizedName = row.name.toLowerCase().trim()
  const headerLabels = new Set(['name', 'sr.no', 'sr no', 'srno', 'description', 'company', 'location'])
  if (headerLabels.has(normalizedName)) return false

  const hasBilling =
    row.yearlyAmount > 0 ||
    row.quarterlyTotal > 0 ||
    row.amountQ1 + row.amountQ2 + row.amountQ3 + row.amountQ4 > 0

  const hasAssets =
    row.serverQtyQ1 + row.serverQtyQ2 + row.serverQtyQ3 + row.serverQtyQ4 +
    row.thinClientQtyQ1 + row.thinClientQtyQ2 + row.thinClientQtyQ3 + row.thinClientQtyQ4 +
    row.laptopDesktopQtyQ1 + row.laptopDesktopQtyQ2 + row.laptopDesktopQtyQ3 + row.laptopDesktopQtyQ4 > 0

  const hasRates =
    row.serverRateYearly > 0 ||
    row.thinClientRateYearly > 0 ||
    row.laptopDesktopRateYearly > 0

  return hasBilling || hasAssets || hasRates
}

export function filterImportableRows(rows: AmcImportRow[]): AmcImportRow[] {
  return rows.filter(isImportableDataRow)
}
