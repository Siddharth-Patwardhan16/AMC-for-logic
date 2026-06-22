import type { PrismaClient } from '@prisma/client'
import {
  QUARTER_DUE_DATES,
  QUARTER_LABELS,
  computedQuarterTotal,
  type LineItemInput,
} from './amc-billing'

export function hasQuarterlyAmounts(amounts: number[]): boolean {
  return amounts.some((a) => a > 0)
}

export function buildInstallmentCreates(amounts: number[], fiscalYear: string) {
  const year = fiscalYear.split('-')[0] ?? '2026'
  const dueDates: Record<number, string> = {
    1: `${year}-06-30`,
    2: `${year}-09-30`,
    3: `${year}-12-31`,
    4: `${Number(year) + 1}-03-31`,
  }

  return ([1, 2, 3, 4] as const).map((quarter) => ({
    quarter,
    label: QUARTER_LABELS[quarter],
    dueDate: new Date(dueDates[quarter] ?? QUARTER_DUE_DATES[quarter]),
    amount: amounts[quarter - 1] ?? 0,
    paidAmount: 0,
    status: 'PENDING' as const,
  }))
}

export function amountsFromLineItems(items: LineItemInput[]): number[] {
  return [1, 2, 3, 4].map((q) => computedQuarterTotal(items, q as 1 | 2 | 3 | 4))
}

export async function syncScheduleInstallments(
  prisma: PrismaClient,
  scheduleId: string,
  enableQuarterlySplit: boolean,
  amounts: number[]
) {
  if (!enableQuarterlySplit) {
    await prisma.amcQuarterInstallment.deleteMany({ where: { scheduleId } })
    return
  }

  const existing = await prisma.amcQuarterInstallment.findMany({
    where: { scheduleId },
    orderBy: { quarter: 'asc' },
  })

  for (const quarter of [1, 2, 3, 4] as const) {
    const amount = amounts[quarter - 1] ?? 0
    const found = existing.find((i) => i.quarter === quarter)
    if (found) {
      await prisma.amcQuarterInstallment.update({
        where: { id: found.id },
        data: { amount, label: QUARTER_LABELS[quarter] },
      })
    } else {
      await prisma.amcQuarterInstallment.create({
        data: {
          scheduleId,
          ...buildInstallmentCreates(amounts, '2026-27').find((i) => i.quarter === quarter)!,
          amount,
        },
      })
    }
  }
}
