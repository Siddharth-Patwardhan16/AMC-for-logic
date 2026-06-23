import type { PrismaClient } from '@prisma/client'
import {
  QUARTER_DUE_DATES,
  QUARTER_LABELS,
  computedQuarterTotal,
  type LineItemInput,
} from './amc-billing'
import { dbInstallmentStatus } from './amc-payment-utils'

export async function ensureDefaultCategories(prisma: Pick<PrismaClient, 'amcCategory'>, companyId: string) {
  const defaults = [
    { name: 'Server', defaultIncludeInEmi: false },
    { name: 'Thin Client', defaultIncludeInEmi: true },
    { name: 'Laptop + Desktop', defaultIncludeInEmi: true },
    { name: 'Firewall', defaultIncludeInEmi: false },
    { name: 'Network', defaultIncludeInEmi: true },
  ]

  await Promise.all(
    defaults.map((cat) =>
      prisma.amcCategory.upsert({
        where: { companyId_name: { companyId, name: cat.name } },
        update: {},
        create: { companyId, ...cat },
      })
    )
  )
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

export async function loadLineItemsAsInput(
  prisma: Pick<PrismaClient, 'amcLineItem'>,
  scheduleId: string
): Promise<LineItemInput[]> {
  const items = await prisma.amcLineItem.findMany({
    where: { scheduleId },
    include: { addons: true },
  })
  return items.map((item) => ({
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
  }))
}

/** Recalculate schedule amounts from line items and sync installments in one pass. */
export async function recalculateScheduleFromLineItems(
  prisma: PrismaClient,
  scheduleId: string
) {
  const schedule = await prisma.amcSchedule.findUnique({ where: { id: scheduleId } })
  if (!schedule) return null

  const items = await loadLineItemsAsInput(prisma, scheduleId)
  const amounts = amountsFromLineItems(items)
  const yearlyTotal = sumYearly(amounts)

  if (!schedule.enableQuarterlySplit) {
    await prisma.amcSchedule.update({
      where: { id: scheduleId },
      data: { yearlyAmount: yearlyTotal },
    })
    return schedule
  }

  await prisma.amcSchedule.update({
    where: { id: scheduleId },
    data: {
      amountQ1: amounts[0],
      amountQ2: amounts[1],
      amountQ3: amounts[2],
      amountQ4: amounts[3],
      quarterlyTotal: yearlyTotal,
      yearlyAmount: yearlyTotal,
    },
  })

  await syncScheduleInstallments(
    prisma,
    scheduleId,
    true,
    amounts,
    schedule.fiscalYear
  )

  return schedule
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

  await prisma.$transaction(
    existing.map((inst) => {
      const amount = amounts[inst.quarter - 1] ?? 0
      const paid = Number(inst.paidAmount)
      return prisma.amcQuarterInstallment.update({
        where: { id: inst.id },
        data: {
          amount,
          status: dbInstallmentStatus(amount, paid, inst.dueDate),
        },
      })
    })
  )
}

export function sumYearly(amounts: [number, number, number, number]) {
  return amounts.reduce((a, b) => a + b, 0)
}
