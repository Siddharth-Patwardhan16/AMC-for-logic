import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const contractRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      contractType: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.contractType) where.contractType = input.contractType
      if (input?.status) where.status = input.status
      return ctx.prisma.contract.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          customerLocation: { select: { id: true, name: true } },
          _count: { select: { assets: true, billings: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contract.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          customerLocation: true,
          assets: true,
          billings: { orderBy: { periodStart: 'asc' } },
          invoices: true,
          documents: true,
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      contractNumber: z.string().min(1),
      contractType: z.string(),
      status: z.string().default('ACTIVE'),
      startDate: z.string().transform(v => new Date(v)),
      endDate: z.string().transform(v => new Date(v)),
      value: z.number().or(z.string()).transform(v => Number(v)),
      billingFrequency: z.string().default('YEARLY'),
      customerId: z.string(),
      customerLocationId: z.string().optional(),
      companyId: z.string(),
      assetIds: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { assetIds, ...data } = input
      const contract = await ctx.prisma.contract.create({
        data: {
          ...data,
          value: String(data.value),
          assets: assetIds.length > 0 ? { connect: assetIds.map(id => ({ id })) } : undefined,
        } as any,
      })
      return contract
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      contractNumber: z.string().min(1).optional(),
      contractType: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      endDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      value: z.number().or(z.string()).optional().transform(v => v ? Number(v) : undefined),
      billingFrequency: z.string().optional(),
      customerLocationId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.contract.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.contract.delete({ where: { id: input.id } })
    }),
})
