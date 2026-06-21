import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const quotationRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.status) where.status = input.status
      return ctx.prisma.quotation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.quotation.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          company: true,
          items: true,
          documents: true,
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.quotation.delete({ where: { id: input.id } })
    }),
})
