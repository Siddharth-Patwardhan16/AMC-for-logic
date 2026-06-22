import type { PrismaClient } from '@prisma/client'
import {
  QUARTER_DUE_DATES,
  QUARTER_LABELS,
  computedQuarterTotal,
  type LineItemInput,
} from './amc-billing'

export async function ensureDefaultCategories(prisma: Pick<PrismaClient, 'amcCategory'>, companyId: string) {
  const defaults = [
    { name: 'Server', defaultIncludeInEmi: false },
    { name: 'Thin Client', defaultIncludeInEmi: true },
    { name: 'Laptop + Desktop', defaultIncludeInEmi: true },
    { name: 'Firewall', defaultIncludeInEmi: false },
    { name: 'Network', defaultIncludeInEmi: true },
  ]

  for (const cat of defaults) {
    await prisma.amcCategory.upsert({
      where: { companyId_name: { companyId, name: cat.name } },
      update: {},
      create: { companyId, ...cat },
    })
  }
}

export function buildInstallmentCreates(
  amounts: [number, number, number, number],
  fiscalYear = '2026-27'
) {
  const yearStart = fiscalYear.split('-')[0]
  const dueDates: Record<number, string> = {
    1: `${yearStart}-06-30`,
    2: `${yearStart}-09-30`,
    3: `${yearStart}-12-31`,
    4: `${Number(yearStart) + 1}-03-31`,
  }

  return ([1, 2, 3, 4] as const).map((quarter) => ({
    quarter,
    label: QUARTER_LABELS[quarter],
    dueDate: new Date(dueDates[quarter] ?? QUARTER_DUE_DATES[quarter]),
    amount: amounts[quarter - 1],
    paidAmount: 0,
    status: 'PENDING' as const,
  }))
}

export function amountsFromLineItems(items: LineItemInput[]): [number, number, number, number] {
  return [1, 2, 3, 4].map((q) => computedQuarterTotal(items, q as 1 | 2 | 3 | 4)) as [
    number, number, number, number,
  ]
}

export async function syncScheduleInstallments(
  prisma: PrismaClient,
  scheduleId: string,
  enableQuarterlySplit: boolean,
  amounts: [number, number, number, number],
  fiscalYear: string
) {
  if (!enableQuarterlySplit) {
    await prisma.amcQuarterInstallment.deleteMany({ where: { scheduleId } })
    return
  }

  const existing = await prisma.amcQuarterInstallment.findMany({
    where: { scheduleId },
    orderBy: { quarter: 'asc' },
  })

  if (!existing.length) {
    await prisma.amcQuarterInstallment.createMany({
      data: buildInstallmentCreates(amounts, fiscalYear).map((inst) => ({
        ...inst,
        scheduleId,
      })),
    })
    return
  }

  for (const inst of existing) {
    const amount = amounts[inst.quarter - 1] ?? 0
    const paid = Number(inst.paidAmount)
    await prisma.amcQuarterInstallment.update({
      where: { id: inst.id },
      data: {
        amount,
        status: paid >= amount && amount > 0 ? 'PAID' : 'PENDING',
      },
    })
  }
}

export function sumYearly(amounts: [number, number, number, number]) {
  return amounts.reduce((a, b) => a + b, 0)
}
