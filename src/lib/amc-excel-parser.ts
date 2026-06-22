import * as XLSX from 'xlsx'

export type AmcImportRow = {
  srNo: number | null
  name: string
  description?: string
  companyLabel: string
  location: string
  serverRateYearly: number
  serverQtyQ1: number
  serverQtyQ2: number
  serverQtyQ3: number
  serverQtyQ4: number
  thinClientRateYearly: number
  thinClientQtyQ1: number
  thinClientQtyQ2: number
  thinClientQtyQ3: number
  thinClientQtyQ4: number
  laptopDesktopRateYearly: number
  laptopDesktopQtyQ1: number
  laptopDesktopQtyQ2: number
  laptopDesktopQtyQ3: number
  laptopDesktopQtyQ4: number
  amountQ1: number
  amountQ2: number
  amountQ3: number
  amountQ4: number
  quarterlyTotal: number
  yearlyAmount: number
  section?: string
}

const SECTION_MARKERS = [
  'monthly bill',
  'computerwala',
  'yearly done',
  'logic systems',
]

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

function parseSheetRow(row: unknown[], currentSection: string): AmcImportRow | null {
  const name = toText(row[1])
  if (!name || isSectionHeader(name)) return null

  const companyLabel = toText(row[3])
  const location = toText(row[4])
  const yearlyAmount = toNumber(row[29])

  const hasAssetData =
    toNumber(row[8]) + toNumber(row[9]) + toNumber(row[10]) + toNumber(row[11]) +
    toNumber(row[14]) + toNumber(row[15]) + toNumber(row[16]) + toNumber(row[17]) +
    toNumber(row[20]) + toNumber(row[21]) + toNumber(row[22]) + toNumber(row[23]) > 0

  if (!companyLabel && !location && yearlyAmount <= 0 && !hasAssetData) {
    return null
  }

  return {
    srNo: toNumber(row[0]) || null,
    name,
    description: toText(row[2]) || undefined,
    companyLabel: companyLabel || 'Logic',
    location: location || 'Head Office',
    serverRateYearly: toNumber(row[5]),
    serverQtyQ1: toNumber(row[8]),
    serverQtyQ2: toNumber(row[9]),
    serverQtyQ3: toNumber(row[10]),
    serverQtyQ4: toNumber(row[11]),
    thinClientRateYearly: toNumber(row[12]),
    thinClientQtyQ1: toNumber(row[14]),
    thinClientQtyQ2: toNumber(row[15]),
    thinClientQtyQ3: toNumber(row[16]),
    thinClientQtyQ4: toNumber(row[17]),
    laptopDesktopRateYearly: toNumber(row[18]),
    laptopDesktopQtyQ1: toNumber(row[20]),
    laptopDesktopQtyQ2: toNumber(row[21]),
    laptopDesktopQtyQ3: toNumber(row[22]),
    laptopDesktopQtyQ4: toNumber(row[23]),
    amountQ1: toNumber(row[24]),
    amountQ2: toNumber(row[25]),
    amountQ3: toNumber(row[26]),
    amountQ4: toNumber(row[27]),
    quarterlyTotal: toNumber(row[28]),
    yearlyAmount,
    section: currentSection,
  }
}

/** Parse AMC Working 26-27 style workbook (sheet Q1). */
export function parseAmcWorkbook(buffer: ArrayBuffer): AmcImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames.includes('Q1') ? 'Q1' : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })

  const parsed: AmcImportRow[] = []
  let currentSection = 'AMC Q1'

  for (const row of rows) {
    if (!Array.isArray(row)) continue

    const marker = toText(row[1]).toLowerCase()
    if (marker.includes('monthly bill')) currentSection = 'Monthly Bill'
    if (marker.includes('computerwala')) currentSection = 'Computerwala'
    if (marker.includes('yearly done')) currentSection = 'Yearly AMC'

    const record = parseSheetRow(row, currentSection)
    if (record) parsed.push(record)
  }

  return parsed
}

export function buildAmcNotes(row: AmcImportRow): string {
  const lines = [
    `Imported from AMC spreadsheet (${row.section ?? 'Q1'})`,
    `Server: Q1=${row.serverQtyQ1}, Q2=${row.serverQtyQ2}, Q3=${row.serverQtyQ3}, Q4=${row.serverQtyQ4} @ ₹${row.serverRateYearly}/yr`,
    `Thin client: Q1=${row.thinClientQtyQ1}, Q2=${row.thinClientQtyQ2}, Q3=${row.thinClientQtyQ3}, Q4=${row.thinClientQtyQ4} @ ₹${row.thinClientRateYearly}/yr`,
    `Laptop/Desktop: Q1=${row.laptopDesktopQtyQ1}, Q2=${row.laptopDesktopQtyQ2}, Q3=${row.laptopDesktopQtyQ3}, Q4=${row.laptopDesktopQtyQ4} @ ₹${row.laptopDesktopRateYearly}/yr`,
    `Billing: Q1=₹${row.amountQ1}, Q2=₹${row.amountQ2}, Q3=₹${row.amountQ3}, Q4=₹${row.amountQ4}`,
    `Yearly total: ₹${row.yearlyAmount}`,
  ]
  if (row.description) lines.unshift(`Description: ${row.description}`)
  return lines.join('\n')
}

export function resolveCompanyId(
  label: string,
  companies: { id: string; name: string }[]
): string | null {
  if (!companies.length) return null

  const normalized = label.toLowerCase()
  const exact = companies.find((c) => c.name.toLowerCase() === normalized)
  if (exact) return exact.id

  const partial = companies.find((c) => {
    const name = c.name.toLowerCase()
    return name.includes(normalized) || normalized.includes(name.split(' ')[0])
  })
  if (partial) return partial.id

  if (normalized.includes('logic')) {
    return companies.find((c) => c.name.toLowerCase().includes('logic'))?.id ?? companies[0].id
  }

  return companies[0].id
}
