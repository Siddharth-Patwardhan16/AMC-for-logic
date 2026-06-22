import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import {
  amountsFromLineItems,
  buildInstallmentCreates,
  ensureDefaultCategories,
  sumYearly,
  syncScheduleInstallments,
} from '@/lib/amc-schedule-sync'
import type { LineItemInput } from '@/lib/amc-billing'

const lineItemAddonSchema = z.object({
  name: z.string().min(1),
  rateYearly: z.number().default(0),
  rateQuarterly: z.number().default(0),
  quantity: z.number().int().default(1),
  includeInEmi: z.boolean().default(false),
})

const lineItemSchema = z.object({
  categoryName: z.string().min(1),
  categoryId: z.string().optional(),
  label: z.string().optional(),
  rateYearly: z.number().default(0),
  rateQuarterly: z.number().default(0),
  qtyQ1: z.number().int().default(0),
  qtyQ2: z.number().int().default(0),
  qtyQ3: z.number().int().default(0),
  qtyQ4: z.number().int().default(0),
  includeInEmi: z.boolean().default(true),
  addons: z.array(lineItemAddonSchema).default([]),
})

const installmentStatus = (amount: number, paid: number) => {
  if (paid <= 0) return 'PENDING' as const
  if (paid >= amount) return 'PAID' as const
  return 'PENDING' as const
}

async function lineItemsToInput(
  prisma: { amcLineItem: { findMany: Function } },
  scheduleId: string
): Promise<LineItemInput[]> {
  const items = await prisma.amcLineItem.findMany({
    where: { scheduleId },
    include: { addons: true },
  })
  return items.map((item: any) => ({
    categoryName: item.categoryName,
    label: item.label,
    rateYearly: Number(item.rateYearly),
    rateQuarterly: Number(item.rateQuarterly),
    qtyQ1: item.qtyQ1,
    qtyQ2: item.qtyQ2,
    qtyQ3: item.qtyQ3,
    qtyQ4: item.qtyQ4,
    includeInEmi: item.includeInEmi,
    addons: item.addons.map((a: any) => ({
      name: a.name,
      rateYearly: Number(a.rateYearly),
      rateQuarterly: Number(a.rateQuarterly),
      quantity: a.quantity,
      includeInEmi: a.includeInEmi,
    })),
  }))
}

export const amcScheduleRouter = router({
  listCategories: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureDefaultCategories(ctx.prisma, input.companyId)
      return ctx.prisma.amcCategory.findMany({
        where: { companyId: input.companyId },
        orderBy: { name: 'asc' },
      })
    }),

  createCategory: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      name: z.string().min(1),
      defaultIncludeInEmi: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.amcCategory.upsert({
        where: { companyId_name: { companyId: input.companyId, name: input.name.trim() } },
        update: { defaultIncludeInEmi: input.defaultIncludeInEmi },
        create: {
          companyId: input.companyId,
          name: input.name.trim(),
          defaultIncludeInEmi: input.defaultIncludeInEmi,
        },
      })
    }),

  getByCustomer: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.amcSchedule.findMany({
        where: { customerId: input.customerId },
        include: {
          lineItems: { include: { addons: true, category: true }, orderBy: { categoryName: 'asc' } },
          installments: {
            include: { payments: { orderBy: { paymentDate: 'desc' } } },
            orderBy: { quarter: 'asc' },
          },
          contract: true,
        },
        orderBy: { fiscalYear: 'desc' },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      companyId: z.string(),
      fiscalYear: z.string().default('2026-27'),
      section: z.string().optional(),
      enableQuarterlySplit: z.boolean().default(false),
      useAutoQuarterlyAmounts: z.boolean().default(true),
      amountQ1: z.number().default(0),
      amountQ2: z.number().default(0),
      amountQ3: z.number().default(0),
      amountQ4: z.number().default(0),
      yearlyAmount: z.number().optional(),
      lineItems: z.array(lineItemSchema).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureDefaultCategories(ctx.prisma, input.companyId)

      const lineItemInputs: LineItemInput[] = input.lineItems.map((item) => ({
        categoryName: item.categoryName,
        label: item.label,
        rateYearly: item.rateYearly,
        rateQuarterly: item.rateQuarterly,
        qtyQ1: item.qtyQ1,
        qtyQ2: item.qtyQ2,
        qtyQ3: item.qtyQ3,
        qtyQ4: item.qtyQ4,
        includeInEmi: item.includeInEmi,
        addons: item.addons,
      }))

      const autoAmounts = amountsFromLineItems(lineItemInputs)
      const amounts: [number, number, number, number] = input.enableQuarterlySplit && input.useAutoQuarterlyAmounts
        ? autoAmounts
        : [input.amountQ1, input.amountQ2, input.amountQ3, input.amountQ4]

      const yearlyAmount = input.yearlyAmount ?? (
        input.enableQuarterlySplit ? sumYearly(amounts) : input.amountQ1
      )

      return ctx.prisma.amcSchedule.create({
        data: {
          customerId: input.customerId,
          companyId: input.companyId,
          fiscalYear: input.fiscalYear,
          section: input.section,
          status: 'ACTIVE',
          enableQuarterlySplit: input.enableQuarterlySplit,
          amountQ1: amounts[0],
          amountQ2: amounts[1],
          amountQ3: amounts[2],
          amountQ4: amounts[3],
          quarterlyTotal: sumYearly(amounts),
          yearlyAmount,
          lineItems: input.lineItems.length ? {
            create: input.lineItems.map((item) => ({
              categoryName: item.categoryName,
              categoryId: item.categoryId,
              label: item.label,
              rateYearly: item.rateYearly,
              rateQuarterly: item.rateQuarterly,
              qtyQ1: item.qtyQ1,
              qtyQ2: item.qtyQ2,
              qtyQ3: item.qtyQ3,
              qtyQ4: item.qtyQ4,
              includeInEmi: item.includeInEmi,
              addons: item.addons.length
                ? { create: item.addons }
                : undefined,
            })),
          } : undefined,
          installments: input.enableQuarterlySplit
            ? { create: buildInstallmentCreates(amounts, input.fiscalYear) }
            : undefined,
        },
        include: {
          lineItems: { include: { addons: true } },
          installments: true,
        },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      enableQuarterlySplit: z.boolean().optional(),
      useAutoQuarterlyAmounts: z.boolean().optional(),
      amountQ1: z.number().optional(),
      amountQ2: z.number().optional(),
      amountQ3: z.number().optional(),
      amountQ4: z.number().optional(),
      yearlyAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.amcSchedule.findUnique({ where: { id: input.id } })
      if (!schedule) throw new Error('Schedule not found')

      const enableQuarterlySplit = input.enableQuarterlySplit ?? schedule.enableQuarterlySplit
      const lineItemInputs = await lineItemsToInput(ctx.prisma, input.id)
      const autoAmounts = amountsFromLineItems(lineItemInputs)

      const amounts: [number, number, number, number] = enableQuarterlySplit && (input.useAutoQuarterlyAmounts ?? true)
        ? autoAmounts
        : [
            input.amountQ1 ?? Number(schedule.amountQ1),
            input.amountQ2 ?? Number(schedule.amountQ2),
            input.amountQ3 ?? Number(schedule.amountQ3),
            input.amountQ4 ?? Number(schedule.amountQ4),
          ]

      const yearlyAmount = input.yearlyAmount ?? (
        enableQuarterlySplit ? sumYearly(amounts) : Number(schedule.yearlyAmount)
      )

      await ctx.prisma.amcSchedule.update({
        where: { id: input.id },
        data: {
          enableQuarterlySplit,
          amountQ1: amounts[0],
          amountQ2: amounts[1],
          amountQ3: amounts[2],
          amountQ4: amounts[3],
          quarterlyTotal: sumYearly(amounts),
          yearlyAmount,
        },
      })

      await syncScheduleInstallments(
        ctx.prisma,
        input.id,
        enableQuarterlySplit,
        amounts,
        schedule.fiscalYear
      )

      return ctx.prisma.amcSchedule.findUnique({
        where: { id: input.id },
        include: {
          lineItems: { include: { addons: true } },
          installments: { include: { payments: true } },
        },
      })
    }),

  addLineItem: protectedProcedure
    .input(z.object({
      scheduleId: z.string(),
      companyId: z.string(),
    }).merge(lineItemSchema))
    .mutation(async ({ ctx, input }) => {
      const { scheduleId, companyId, addons, ...item } = input

      await ctx.prisma.amcCategory.upsert({
        where: { companyId_name: { companyId, name: item.categoryName.trim() } },
        update: {},
        create: {
          companyId,
          name: item.categoryName.trim(),
          defaultIncludeInEmi: item.includeInEmi,
        },
      })

      const created = await ctx.prisma.amcLineItem.create({
        data: {
          scheduleId,
          categoryName: item.categoryName.trim(),
          categoryId: item.categoryId,
          label: item.label,
          rateYearly: item.rateYearly,
          rateQuarterly: item.rateQuarterly,
          qtyQ1: item.qtyQ1,
          qtyQ2: item.qtyQ2,
          qtyQ3: item.qtyQ3,
          qtyQ4: item.qtyQ4,
          includeInEmi: item.includeInEmi,
          addons: addons.length ? { create: addons } : undefined,
        },
        include: { addons: true },
      })

      const schedule = await ctx.prisma.amcSchedule.findUnique({ where: { id: scheduleId } })
      if (schedule?.enableQuarterlySplit) {
        const items = await lineItemsToInput(ctx.prisma, scheduleId)
        const amounts = amountsFromLineItems(items)
        await ctx.prisma.amcSchedule.update({
          where: { id: scheduleId },
          data: {
            amountQ1: amounts[0],
            amountQ2: amounts[1],
            amountQ3: amounts[2],
            amountQ4: amounts[3],
            quarterlyTotal: sumYearly(amounts),
            yearlyAmount: sumYearly(amounts),
          },
        })
        await syncScheduleInstallments(ctx.prisma, scheduleId, true, amounts, schedule.fiscalYear)
      }

      return created
    }),

  recordInstallmentPayment: protectedProcedure
    .input(z.object({
      installmentId: z.string(),
      amount: z.number().positive(),
      paymentDate: z.string().optional(),
      paymentMode: z.string().default('BANK_TRANSFER'),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const installment = await ctx.prisma.amcQuarterInstallment.findUnique({
        where: { id: input.installmentId },
        include: { schedule: true },
      })
      if (!installment) throw new Error('Installment not found')

      const newPaid = Number(installment.paidAmount) + input.amount
      const total = Number(installment.amount)

      const payment = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            amount: input.amount,
            paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
            paymentMode: input.paymentMode as any,
            reference: input.reference,
            notes: input.notes,
            customerId: installment.schedule.customerId,
            installmentId: installment.id,
          },
        })

        await tx.amcQuarterInstallment.update({
          where: { id: installment.id },
          data: {
            paidAmount: newPaid,
            status: installmentStatus(total, newPaid),
          },
        })

        return created
      })

      return payment
    }),

  addLineItemAddon: protectedProcedure
    .input(z.object({
      lineItemId: z.string(),
      name: z.string().min(1),
      rateYearly: z.number().default(0),
      rateQuarterly: z.number().default(0),
      quantity: z.number().int().default(1),
      includeInEmi: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.amcLineItemAddon.create({
        data: {
          lineItemId: input.lineItemId,
          name: input.name,
          rateYearly: input.rateYearly,
          rateQuarterly: input.rateQuarterly,
          quantity: input.quantity,
          includeInEmi: input.includeInEmi,
        },
      })
    }),

  deleteLineItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.amcLineItem.findUnique({ where: { id: input.id } })
      if (!item) throw new Error('Line item not found')

      await ctx.prisma.amcLineItem.delete({ where: { id: input.id } })

      const schedule = await ctx.prisma.amcSchedule.findUnique({ where: { id: item.scheduleId } })
      if (schedule?.enableQuarterlySplit) {
        const items = await lineItemsToInput(ctx.prisma, item.scheduleId)
        const amounts = amountsFromLineItems(items)
        await ctx.prisma.amcSchedule.update({
          where: { id: item.scheduleId },
          data: {
            amountQ1: amounts[0],
            amountQ2: amounts[1],
            amountQ3: amounts[2],
            amountQ4: amounts[3],
            quarterlyTotal: sumYearly(amounts),
            yearlyAmount: sumYearly(amounts),
          },
        })
        await syncScheduleInstallments(ctx.prisma, item.scheduleId, true, amounts, schedule.fiscalYear)
      }

      return { success: true }
    }),
})
