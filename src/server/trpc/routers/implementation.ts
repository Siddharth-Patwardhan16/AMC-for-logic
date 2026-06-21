import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const implementationRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      customerId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      return ctx.prisma.implementation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { assets: true } },
        },
        orderBy: { implementDate: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.implementation.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          assets: { include: { asset: true } },
          documents: true,
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      implementDate: z.string().transform(v => new Date(v)),
      engineerName: z.string().optional(),
      customerId: z.string(),
      companyId: z.string(),
      assets: z.array(z.object({
        quantity: z.number().default(1),
        description: z.string().optional(),
        assetId: z.string().optional(),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { assets, ...data } = input
      return ctx.prisma.implementation.create({
        data: {
          ...data,
          assets: { create: assets },
        } as any,
        include: { assets: true },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      implementDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      engineerName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.implementation.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.implementation.delete({ where: { id: input.id } })
    }),
})
