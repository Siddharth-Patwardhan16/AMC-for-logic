import type { PrismaClient } from '@prisma/client'
import type { AmcImportRow } from './amc-excel-parser'
import {
  FISCAL_YEAR_26_27,
  hasQuarterlyAmounts,
  lineItemsFromImportRow,
} from './amc-billing'
import {
  buildInstallmentCreates,
  ensureDefaultCategories,
} from './amc-schedule-sync'

type CreateScheduleParams = {
  customerId: string
  companyId: string
  contractId?: string
  row: AmcImportRow
}

export async function createAmcScheduleFromRow(
  prisma: PrismaClient,
  { customerId, companyId, contractId, row }: CreateScheduleParams
) {
  await ensureDefaultCategories(prisma, companyId)

  const lineItems = lineItemsFromImportRow(row)
  const amounts = [row.amountQ1, row.amountQ2, row.amountQ3, row.amountQ4] as const
  const enableQuarterlySplit = hasQuarterlyAmounts([...amounts])
  const yearlyAmount = row.yearlyAmount || row.quarterlyTotal || amounts.reduce((a, b) => a + b, 0)

  return prisma.amcSchedule.create({
    data: {
      fiscalYear: FISCAL_YEAR_26_27,
      section: row.section,
      status: 'ACTIVE',
      enableQuarterlySplit,
      amountQ1: row.amountQ1,
      amountQ2: row.amountQ2,
      amountQ3: row.amountQ3,
      amountQ4: row.amountQ4,
      quarterlyTotal: row.quarterlyTotal || amounts.reduce((a, b) => a + b, 0),
      yearlyAmount,
      customerId,
      companyId,
      contractId,
      lineItems: {
        create: lineItems.map((item) => ({
          categoryName: item.categoryName,
          label: item.label,
          rateYearly: item.rateYearly,
          rateQuarterly: item.rateQuarterly,
          qtyQ1: item.qtyQ1,
          qtyQ2: item.qtyQ2,
          qtyQ3: item.qtyQ3,
          qtyQ4: item.qtyQ4,
          includeInEmi: item.includeInEmi,
          addons: item.addons?.length
            ? {
                create: item.addons.map((addon) => ({
                  name: addon.name,
                  rateYearly: addon.rateYearly,
                  rateQuarterly: addon.rateQuarterly,
                  quantity: addon.quantity,
                  includeInEmi: addon.includeInEmi,
                })),
              }
            : undefined,
        })),
      },
      installments: enableQuarterlySplit
        ? { create: buildInstallmentCreates([...amounts], FISCAL_YEAR_26_27) }
        : undefined,
    },
    include: {
      lineItems: { include: { addons: true } },
      installments: true,
    },
  })
}
