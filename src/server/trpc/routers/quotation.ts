import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'
import { getNextInvoiceNumber, getNextQuotationNumber } from '../utils/document-number'

export const quotationRouter = router({
  getNextNumber: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getNextQuotationNumber(ctx.prisma, input.companyId)
    }),

  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { quotationNumber: { contains: input.search, mode: 'insensitive' } },
          { customer: { name: { contains: input.search, mode: 'insensitive' } } },
        ]
      }
      const queryArgs = {
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' as const },
      }
      const [items, total] = await Promise.all([
        ctx.prisma.quotation.findMany({ ...queryArgs, skip, take }),
        ctx.prisma.quotation.count({ where }),
      ])
      return paginatedResult(items, total, page, pageSize)
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.quotation.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          company: true,
          createdBy: { select: { id: true, name: true, email: true } },
          items: { orderBy: { createdAt: 'asc' } },
          documents: { orderBy: { createdAt: 'desc' } },
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      quotationNumber: z.string().min(1),
      version: z.number().default(1),
      status: z.string().default('DRAFT'),
      subtotal: z.number().or(z.string()).transform(v => String(v)),
      discount: z.number().or(z.string()).optional().transform(v => v ? String(v) : '0'),
      taxAmount: z.number().or(z.string()).transform(v => String(v)),
      totalAmount: z.number().or(z.string()).transform(v => String(v)),
      validUntil: z.string().optional().transform(v => v ? new Date(v) : undefined),
      notes: z.string().optional(),
      terms: z.string().optional(),
      customerId: z.string(),
      companyId: z.string(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number().default(1),
        unitPrice: z.number().or(z.string()).transform(v => String(v)),
        discount: z.number().or(z.string()).optional().transform(v => v ? String(v) : '0'),
        taxRate: z.number().or(z.string()).optional().transform(v => v ? String(v) : '18'),
        total: z.number().or(z.string()).transform(v => String(v)),
        itemType: z.string().default('PRODUCT'),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, ...data } = input
      return ctx.prisma.quotation.create({
        data: {
          ...data,
          createdById: ctx.user.id,
          items: { create: items },
        } as any,
        include: { items: true },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string().optional(),
      version: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.quotation.update({ where: { id }, data: data as any })
    }),

  convertToInvoice: protectedProcedure
    .input(z.object({
      id: z.string(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const quotation = await tx.quotation.findUnique({
          where: { id: input.id },
          include: { items: true },
        })

        if (!quotation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Quotation not found' })
        }

        if (quotation.status === 'CONVERTED') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This quotation has already been converted',
          })
        }

        const invoiceNumber = await getNextInvoiceNumber(tx, quotation.companyId)
        const dueDate = input.dueDate
          ? new Date(input.dueDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            invoiceType: 'TAX_INVOICE',
            status: 'DRAFT',
            issueDate: new Date(),
            dueDate,
            subtotal: quotation.subtotal,
            discount: quotation.discount,
            taxAmount: quotation.taxAmount,
            totalAmount: quotation.totalAmount,
            notes: quotation.notes,
            terms: quotation.terms,
            customerId: quotation.customerId,
            companyId: quotation.companyId,
            createdById: ctx.user.id,
            items: {
              create: quotation.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                taxRate: item.taxRate,
                total: item.total,
              })),
            },
          },
          include: { items: true },
        })

        await tx.quotation.update({
          where: { id: quotation.id },
          data: { status: 'CONVERTED' },
        })

        return invoice
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.quotation.delete({ where: { id: input.id } })
    }),
})
