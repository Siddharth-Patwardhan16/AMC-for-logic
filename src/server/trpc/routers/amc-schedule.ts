import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import {
  amountsFromLineItems,
  buildInstallmentCreates,
  ensureDefaultCategories,
  loadLineItemsAsInput,
  recalculateScheduleFromLineItems,
  sumYearly,
  syncScheduleInstallments,
} from '@/lib/amc-schedule-sync'
import type { LineItemInput } from '@/lib/amc-billing'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'
import { customerPaymentSummaries, dbInstallmentStatus, quarterPaymentStatus } from '@/lib/amc-payment-utils'

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

const scheduleInclude = {
  lineItems: { include: { addons: true, category: true }, orderBy: { categoryName: 'asc' as const } },
  installments: {
    include: { payments: { orderBy: { paymentDate: 'desc' as const } } },
    orderBy: { quarter: 'asc' as const },
  },
  contract: true,
  company: { select: { id: true, name: true } },
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
        include: scheduleInclude,
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
      const lineItemInputs = await loadLineItemsAsInput(ctx.prisma, input.id)
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

      await recalculateScheduleFromLineItems(ctx.prisma, scheduleId)
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
            status: dbInstallmentStatus(total, newPaid, installment.dueDate),
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
      const lineItem = await ctx.prisma.amcLineItem.findUnique({
        where: { id: input.lineItemId },
        select: { scheduleId: true },
      })
      if (!lineItem) throw new Error('Line item not found')

      const addon = await ctx.prisma.amcLineItemAddon.create({
        data: {
          lineItemId: input.lineItemId,
          name: input.name,
          rateYearly: input.rateYearly,
          rateQuarterly: input.rateQuarterly,
          quantity: input.quantity,
          includeInEmi: input.includeInEmi,
        },
      })

      await recalculateScheduleFromLineItems(ctx.prisma, lineItem.scheduleId)
      return addon
    }),

  deleteLineItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.amcLineItem.findUnique({ where: { id: input.id } })
      if (!item) throw new Error('Line item not found')

      await ctx.prisma.amcLineItem.delete({ where: { id: input.id } })
      await recalculateScheduleFromLineItems(ctx.prisma, item.scheduleId)

      return { success: true }
    }),

  customerPaymentBoard: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)

      const filters: Record<string, unknown>[] = [
        { amcSchedules: { some: {} } },
      ]
      if (input?.companyId) filters.push({ companyId: input.companyId })
      if (input?.search?.trim()) {
        const term = input.search.trim()
        filters.push({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { gst: { contains: term, mode: 'insensitive' } },
          ],
        })
      }

      const where = { AND: filters }

      const [customers, total] = await Promise.all([
        ctx.prisma.customer.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            name: true,
            gst: true,
            status: true,
            company: { select: { id: true, name: true } },
            amcSchedules: {
              select: {
                id: true,
                fiscalYear: true,
                section: true,
                enableQuarterlySplit: true,
                yearlyAmount: true,
                company: { select: { name: true } },
                installments: {
                  select: {
                    id: true,
                    quarter: true,
                    label: true,
                    dueDate: true,
                    amount: true,
                    paidAmount: true,
                  },
                  orderBy: { quarter: 'asc' },
                },
              },
              orderBy: { fiscalYear: 'desc' },
            },
            _count: { select: { invoices: true, quotations: true } },
          },
          orderBy: { name: 'asc' },
        }),
        ctx.prisma.customer.count({ where }),
      ])

      const items = customers.map((customer) => {
        const payment = customerPaymentSummaries(customer.amcSchedules)
        return {
          id: customer.id,
          name: customer.name,
          gst: customer.gst,
          status: customer.status,
          company: customer.company,
          invoiceCount: customer._count.invoices,
          quotationCount: customer._count.quotations,
          outstanding: payment.outstanding,
          overdueQuarters: payment.overdueQuarters,
          schedules: payment.schedules,
        }
      })

      return paginatedResult(items, total, page, pageSize)
    }),

  paymentReminders: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      daysAhead: z.number().int().min(1).max(180).default(45),
    }).optional())
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const horizon = new Date()
      horizon.setDate(horizon.getDate() + (input?.daysAhead ?? 45))

      const installments = await ctx.prisma.amcQuarterInstallment.findMany({
        where: {
          amount: { gt: 0 },
          dueDate: { lte: horizon },
          status: { in: ['PENDING', 'OVERDUE'] },
          schedule: input?.companyId ? { companyId: input.companyId } : undefined,
        },
        select: {
          id: true,
          quarter: true,
          label: true,
          dueDate: true,
          amount: true,
          paidAmount: true,
          schedule: {
            select: {
              fiscalYear: true,
              section: true,
              company: { select: { name: true } },
              customer: {
                select: {
                  id: true,
                  name: true,
                  company: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      })

      const reminders = installments
        .map((inst) => {
          const amount = Number(inst.amount)
          const paid = Number(inst.paidAmount)
          const balance = Math.max(0, amount - paid)
          if (balance <= 0) return null

          const status = quarterPaymentStatus(amount, paid, inst.dueDate)
          const dueDate = new Date(inst.dueDate)
          const isUpcoming = dueDate >= now && dueDate <= horizon
          const isOverdue = status === 'OVERDUE'

          if (!isUpcoming && !isOverdue) return null

          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          return {
            id: inst.id,
            quarter: inst.quarter,
            label: inst.label,
            dueDate: inst.dueDate,
            amount,
            paid,
            balance,
            status,
            daysUntilDue,
            customer: inst.schedule.customer,
            fiscalYear: inst.schedule.fiscalYear,
            section: inst.schedule.section,
            scheduleCompany: inst.schedule.company?.name ?? null,
          }
        })
        .filter(Boolean)

      reminders.sort((a, b) => {
        if (!a || !b) return 0
        if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1
        if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

      return {
        overdue: reminders.filter((r) => r?.status === 'OVERDUE'),
        upcoming: reminders.filter((r) => r?.status === 'PENDING'),
        totalOutstanding: reminders.reduce((sum, r) => sum + (r?.balance ?? 0), 0),
      }
    }),
})
