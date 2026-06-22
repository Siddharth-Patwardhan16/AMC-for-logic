import * as XLSX from 'xlsx'
import {
  AMC_DEFAULT_COLUMN_MAP,
  type AmcColumnMap,
  type AmcImportRow,
  filterImportableRows,
  isImportableDataRow,
} from './amc-import-schema'

export type { AmcImportRow } from './amc-import-schema'
export { filterImportableRows, isImportableDataRow } from './amc-import-schema'

const SECTION_MARKERS = [
  'monthly bill',
  'computerwala',
  'yearly done',
  'logic systems',
]

const HEADER_LABELS = new Set([
  'name',
  'sr.no',
  'sr no',
  'srno',
  'description',
  'company',
  'location',
  'rate yearly',
  'rate qurterly',
  'rate quarterly',
  'rate qtyly',
  'final rate',
])

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function isSectionHeader(name: string): boolean {
  const lower = name.toLowerCase()
  return SECTION_MARKERS.some((marker) => lower === marker || lower.startsWith(marker))
}

function isHeaderOrTemplateRow(row: unknown[], name: string, col: AmcColumnMap): boolean {
  const normalizedName = name.toLowerCase().trim()
  if (HEADER_LABELS.has(normalizedName)) return true

  const col0 = toText(row[col.srNo]).toLowerCase().replace(/\./g, '')
  if (col0 === 'srno' || col0 === 'sr') return true

  const companyCol = toText(row[col.company]).toLowerCase()
  const locationCol = toText(row[col.location]).toLowerCase()
  if (normalizedName === 'name' && companyCol === 'company') return true
  if (companyCol === 'company' && locationCol === 'location') return true

  return false
}

function headerMatches(cell: string, patterns: string[]): boolean {
  return patterns.some((p) => cell.includes(p))
}

/** Detect column indices from the header row (AMC Working 26-27 Q1 sheet). */
export function detectColumnMap(headerRow: unknown[]): AmcColumnMap {
  const map: AmcColumnMap = { ...AMC_DEFAULT_COLUMN_MAP }
  const normalized = headerRow.map(normalizeHeader)

  for (let i = 0; i < normalized.length; i++) {
    const h = normalized[i]
    if (!h) continue

    if (headerMatches(h, ['srno', 'sr no'])) map.srNo = i
    else if (h === 'name') map.name = i
    else if (h === 'description') map.description = i
    else if (h === 'company') map.company = i
    else if (h === 'location') map.location = i
    else if (headerMatches(h, ['sophos'])) map.sophosFirewall = i
    else if (headerMatches(h, ['quarterly total', 'qurterly total'])) map.quarterlyTotal = i
    else if (headerMatches(h, ['yearly amount', 'yearly amt'])) map.yearlyAmount = i
    else if (headerMatches(h, ['amt q1', 'amount q1'])) map.amountQ1 = i
    else if (headerMatches(h, ['amt q2', 'amount q2'])) map.amountQ2 = i
    else if (headerMatches(h, ['amt q3', 'amount q3'])) map.amountQ3 = i
    else if (headerMatches(h, ['amt q4', 'amount q4'])) map.amountQ4 = i
    else if (headerMatches(h, ['qty q1 server']) || h === 'qty q1 server') map.serverQtyQ1 = i
    else if (headerMatches(h, ['qty q2 server']) || h === 'qty q2 server') map.serverQtyQ2 = i
    else if (headerMatches(h, ['qty q3 server']) || h === 'qty q3 server') map.serverQtyQ3 = i
    else if (headerMatches(h, ['qty q4 server']) || h === 'qty q4 server') map.serverQtyQ4 = i
    else if (headerMatches(h, ['qty q2 thin', 'qty q2 thin clien'])) map.thinClientQtyQ2 = i
    else if (headerMatches(h, ['qty q3 thin', 'qty q3 thin clien'])) map.thinClientQtyQ3 = i
    else if (headerMatches(h, ['qty q1-laptop', 'qty q1 laptop'])) map.laptopDesktopQtyQ1 = i
    else if (headerMatches(h, ['qty q2-laptop', 'qty q2 laptop'])) map.laptopDesktopQtyQ2 = i
    else if (headerMatches(h, ['qty q3-laptop', 'qty q3 laptop'])) map.laptopDesktopQtyQ3 = i
    else if (headerMatches(h, ['qty q4-laptop', 'qty q4 laptop'])) map.laptopDesktopQtyQ4 = i
    else if (h === 'final rate') map.laptopDesktopRateYearly = i
    else if (h === 'rate yearly' && i <= map.serverRateQuarterly) map.serverRateYearly = i
    else if (h === 'rate yearly' && i > map.serverQtyQ4 && i <= map.thinClientRateQuarterly) map.thinClientRateYearly = i
    else if (headerMatches(h, ['rate qtyly', 'rate qurterly', 'rate quarterly'])) {
      if (i <= map.serverQtyQ1) map.serverRateQuarterly = i
      else if (i <= map.thinClientQtyQ1) map.thinClientRateQuarterly = i
      else if (i <= map.laptopDesktopQtyQ1) map.laptopDesktopRateQuarterly = i
    }
    else if (h === 'qty q1' && i > map.serverRateQuarterly && i < map.thinClientRateYearly) map.thinClientQtyQ1 = i
    else if (h === 'qty q4' && i > map.thinClientQtyQ3 && i < map.laptopDesktopQtyQ1) map.thinClientQtyQ4 = i
    else if (h === 'qty q4' && i >= map.laptopDesktopQtyQ3) map.laptopDesktopQtyQ4 = i
  }

  return map
}

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    const nameIdx = row.findIndex((cell) => normalizeHeader(cell) === 'name')
    const companyIdx = row.findIndex((cell) => normalizeHeader(cell) === 'company')
    if (nameIdx >= 0 && companyIdx >= 0) return i
  }
  return 2
}

function parseSophos(row: unknown[], col: AmcColumnMap): {
  quantity: number
  rateYearly: number
  rateQuarterly: number
} {
  const raw = toNumber(row[col.sophosFirewall])
  if (raw <= 0) return { quantity: 0, rateYearly: 0, rateQuarterly: 0 }

  // Small integers are license counts (e.g. Ganorkar Hospital = 2 firewalls)
  if (raw < 100 && Number.isInteger(raw)) {
    const serverYearly = toNumber(row[col.serverRateYearly])
    const serverQuarterly = toNumber(row[col.serverRateQuarterly])
    return {
      quantity: raw,
      rateYearly: serverYearly > 0 ? serverYearly / 4 : 0,
      rateQuarterly: serverQuarterly > 0 ? serverQuarterly : serverYearly / 4,
    }
  }

  return {
    quantity: 1,
    rateYearly: raw,
    rateQuarterly: raw / 4,
  }
}

function parseSheetRow(
  row: unknown[],
  currentSection: string,
  col: AmcColumnMap
): AmcImportRow | null {
  const name = toText(row[col.name])
  if (!name || isSectionHeader(name) || isHeaderOrTemplateRow(row, name, col)) return null

  const companyLabel = toText(row[col.company])
  const location = toText(row[col.location])
  const yearlyAmount = toNumber(row[col.yearlyAmount])
  const sophos = parseSophos(row, col)

  const hasAssetData =
    toNumber(row[col.serverQtyQ1]) + toNumber(row[col.serverQtyQ2]) +
    toNumber(row[col.serverQtyQ3]) + toNumber(row[col.serverQtyQ4]) +
    toNumber(row[col.thinClientQtyQ1]) + toNumber(row[col.thinClientQtyQ2]) +
    toNumber(row[col.thinClientQtyQ3]) + toNumber(row[col.thinClientQtyQ4]) +
    toNumber(row[col.laptopDesktopQtyQ1]) + toNumber(row[col.laptopDesktopQtyQ2]) +
    toNumber(row[col.laptopDesktopQtyQ3]) + toNumber(row[col.laptopDesktopQtyQ4]) > 0

  if (!companyLabel && !location && yearlyAmount <= 0 && !hasAssetData) {
    return null
  }

  const serverRateYearly = toNumber(row[col.serverRateYearly])
  const serverRateQuarterly = toNumber(row[col.serverRateQuarterly]) || serverRateYearly / 4

  const thinClientRateYearly = toNumber(row[col.thinClientRateYearly])
  const thinClientRateQuarterly = toNumber(row[col.thinClientRateQuarterly]) || thinClientRateYearly / 4

  const laptopDesktopRateYearly = toNumber(row[col.laptopDesktopRateYearly])
  const laptopDesktopRateQuarterly = toNumber(row[col.laptopDesktopRateQuarterly]) || laptopDesktopRateYearly / 4

  const amountQ1 = toNumber(row[col.amountQ1])
  const amountQ2 = toNumber(row[col.amountQ2])
  const amountQ3 = toNumber(row[col.amountQ3])
  const amountQ4 = toNumber(row[col.amountQ4])
  const quarterlyTotal = toNumber(row[col.quarterlyTotal]) || amountQ1 + amountQ2 + amountQ3 + amountQ4

  return {
    srNo: toNumber(row[col.srNo]) || null,
    name,
    description: toText(row[col.description]) || undefined,
    companyLabel: companyLabel || 'Logic',
    location: location || 'Head Office',
    serverRateYearly,
    serverRateQuarterly,
    sophosQuantity: sophos.quantity,
    sophosRateYearly: sophos.rateYearly,
    sophosRateQuarterly: sophos.rateQuarterly,
    serverQtyQ1: toNumber(row[col.serverQtyQ1]),
    serverQtyQ2: toNumber(row[col.serverQtyQ2]),
    serverQtyQ3: toNumber(row[col.serverQtyQ3]),
    serverQtyQ4: toNumber(row[col.serverQtyQ4]),
    thinClientRateYearly,
    thinClientRateQuarterly,
    thinClientQtyQ1: toNumber(row[col.thinClientQtyQ1]),
    thinClientQtyQ2: toNumber(row[col.thinClientQtyQ2]),
    thinClientQtyQ3: toNumber(row[col.thinClientQtyQ3]),
    thinClientQtyQ4: toNumber(row[col.thinClientQtyQ4]),
    laptopDesktopRateYearly,
    laptopDesktopRateQuarterly,
    laptopDesktopQtyQ1: toNumber(row[col.laptopDesktopQtyQ1]),
    laptopDesktopQtyQ2: toNumber(row[col.laptopDesktopQtyQ2]),
    laptopDesktopQtyQ3: toNumber(row[col.laptopDesktopQtyQ3]),
    laptopDesktopQtyQ4: toNumber(row[col.laptopDesktopQtyQ4]),
    amountQ1,
    amountQ2,
    amountQ3,
    amountQ4,
    quarterlyTotal,
    yearlyAmount: yearlyAmount || quarterlyTotal,
    section: currentSection,
  }
}

export type AmcParseResult = {
  rows: AmcImportRow[]
  sheetName: string
  columnMap: AmcColumnMap
  headerRowIndex: number
}

/** Parse AMC Working 26-27 style workbook (sheet Q1). */
export function parseAmcWorkbook(buffer: ArrayBuffer): AmcImportRow[] {
  return parseAmcWorkbookDetailed(buffer).rows
}

export function parseAmcWorkbookDetailed(buffer: ArrayBuffer): AmcParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames.includes('Q1') ? 'Q1' : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })

  const headerRowIndex = findHeaderRowIndex(rows)
  const columnMap = detectColumnMap(rows[headerRowIndex] ?? [])

  const parsed: AmcImportRow[] = []
  let currentSection = 'AMC Q1'

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue

    const marker = toText(row[columnMap.name]).toLowerCase()
    if (marker.includes('monthly bill')) currentSection = 'Monthly Bill'
    if (marker.includes('computerwala')) currentSection = 'Computerwala'
    if (marker.includes('yearly done')) currentSection = 'Yearly AMC'

    const record = parseSheetRow(row, currentSection, columnMap)
    if (record) parsed.push(record)
  }

  return {
    rows: filterImportableRows(parsed),
    sheetName,
    columnMap,
    headerRowIndex,
  }
}

export function buildAmcNotes(row: AmcImportRow): string {
  const lines = [
    `Imported from AMC spreadsheet (${row.section ?? 'Q1'})`,
    `Server: Q1=${row.serverQtyQ1}, Q2=${row.serverQtyQ2}, Q3=${row.serverQtyQ3}, Q4=${row.serverQtyQ4} @ ₹${row.serverRateYearly}/yr (₹${row.serverRateQuarterly}/qtr)`,
  ]
  if (row.sophosQuantity > 0) {
    lines.push(`Sophos Firewall: ${row.sophosQuantity} license(s)`)
  }
  lines.push(
    `Thin client: Q1=${row.thinClientQtyQ1}, Q2=${row.thinClientQtyQ2}, Q3=${row.thinClientQtyQ3}, Q4=${row.thinClientQtyQ4} @ ₹${row.thinClientRateYearly}/yr`,
    `Laptop/Desktop: Q1=${row.laptopDesktopQtyQ1}, Q2=${row.laptopDesktopQtyQ2}, Q3=${row.laptopDesktopQtyQ3}, Q4=${row.laptopDesktopQtyQ4} @ ₹${row.laptopDesktopRateYearly}/yr`,
    `Quarterly EMI: Q1=₹${row.amountQ1}, Q2=₹${row.amountQ2}, Q3=₹${row.amountQ3}, Q4=₹${row.amountQ4}`,
    `Yearly total: ₹${row.yearlyAmount}`,
  )
  if (row.description) lines.unshift(`Description: ${row.description}`)
  return lines.join('\n')
}

/** Match company by exact name (case-insensitive). Returns null when no match — never guess. */
export function resolveCompanyId(
  label: string,
  companies: { id: string; name: string }[]
): string | null {
  const normalized = label.trim().toLowerCase()
  if (!normalized || !companies.length) return null

  return companies.find((c) => c.name.trim().toLowerCase() === normalized)?.id ?? null
}
