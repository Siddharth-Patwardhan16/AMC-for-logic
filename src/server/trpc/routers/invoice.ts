import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const invoiceRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      invoiceType: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.invoiceType) where.invoiceType = input.invoiceType
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { invoiceNumber: { contains: input.search, mode: 'insensitive' } },
          { customer: { name: { contains: input.search, mode: 'insensitive' } } },
        ]
      }
      return ctx.prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          contract: { select: { id: true, contractNumber: true } },
          _count: { select: { items: true, payments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invoice.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          company: true,
          contract: true,
          items: true,
          payments: true,
          billings: true,
          documents: true,
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      invoiceNumber: z.string().min(1),
      invoiceType: z.string().default('TAX_INVOICE'),
      status: z.string().default('DRAFT'),
      issueDate: z.string().optional().transform(v => v ? new Date(v) : new Date()),
      dueDate: z.string().transform(v => new Date(v)),
      subtotal: z.number().or(z.string()).transform(v => String(v)),
      discount: z.number().or(z.string()).optional().transform(v => v ? String(v) : '0'),
      taxAmount: z.number().or(z.string()).transform(v => String(v)),
      totalAmount: z.number().or(z.string()).transform(v => String(v)),
      notes: z.string().optional(),
      terms: z.string().optional(),
      customerId: z.string(),
      companyId: z.string(),
      contractId: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number().default(1),
        unitPrice: z.number().or(z.string()).transform(v => String(v)),
        discount: z.number().or(z.string()).optional().transform(v => v ? String(v) : '0'),
        taxRate: z.number().or(z.string()).optional().transform(v => v ? String(v) : '18'),
        total: z.number().or(z.string()).transform(v => String(v)),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { items, ...data } = input
      return ctx.prisma.invoice.create({
        data: {
          ...data,
          items: { create: items },
        } as any,
        include: { items: true },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string().optional(),
      paidAmount: z.number().or(z.string()).optional().transform(v => v ? String(v) : undefined),
      tdsAmount: z.number().or(z.string()).optional().transform(v => v ? String(v) : undefined),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.invoice.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.invoice.delete({ where: { id: input.id } })
    }),
})
