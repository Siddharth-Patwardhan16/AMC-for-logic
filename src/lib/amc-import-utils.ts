import type { AmcImportRow } from './amc-import-schema'

/** Round currency fields for Prisma Decimal columns. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function normalizeImportRow(row: AmcImportRow): AmcImportRow {
  return {
    ...row,
    serverRateYearly: roundMoney(row.serverRateYearly),
    serverRateQuarterly: roundMoney(row.serverRateQuarterly),
    sophosRateYearly: roundMoney(row.sophosRateYearly),
    sophosRateQuarterly: roundMoney(row.sophosRateQuarterly),
    thinClientRateYearly: roundMoney(row.thinClientRateYearly),
    thinClientRateQuarterly: roundMoney(row.thinClientRateQuarterly),
    laptopDesktopRateYearly: roundMoney(row.laptopDesktopRateYearly),
    laptopDesktopRateQuarterly: roundMoney(row.laptopDesktopRateQuarterly),
    amountQ1: roundMoney(row.amountQ1),
    amountQ2: roundMoney(row.amountQ2),
    amountQ3: roundMoney(row.amountQ3),
    amountQ4: roundMoney(row.amountQ4),
    quarterlyTotal: roundMoney(row.quarterlyTotal),
    yearlyAmount: roundMoney(row.yearlyAmount),
  }
}
