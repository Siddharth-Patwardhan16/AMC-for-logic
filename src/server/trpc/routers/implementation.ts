import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'

export const implementationRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { customer: { name: { contains: input.search, mode: 'insensitive' } } },
        ]
      }
      const queryArgs = {
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { assets: true } },
        },
        orderBy: { implementDate: 'desc' as const },
      }
      const [items, total] = await Promise.all([
        ctx.prisma.implementation.findMany({ ...queryArgs, skip, take }),
        ctx.prisma.implementation.count({ where }),
      ])
      return paginatedResult(items, total, page, pageSize)
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
