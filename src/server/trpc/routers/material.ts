import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'

export const materialRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.category) where.category = input.category
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { sku: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      const queryArgs = {
        where,
        orderBy: { createdAt: 'desc' as const },
      }
      const [items, total] = await Promise.all([
        ctx.prisma.material.findMany({ ...queryArgs, skip, take }),
        ctx.prisma.material.count({ where }),
      ])
      return paginatedResult(items, total, page, pageSize)
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.material.findUnique({
        where: { id: input.id },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      sku: z.string().min(1),
      category: z.string().default('OTHER'),
      unit: z.string().default('pcs'),
      quantity: z.number().int().min(0).default(0),
      minStockLevel: z.number().int().min(0).default(0),
      unitPrice: z.number().min(0).default(0),
      status: z.string().default('IN_STOCK'),
      notes: z.string().optional(),
      companyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.material.create({ data: input as any })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      sku: z.string().min(1).optional(),
      category: z.string().optional(),
      unit: z.string().optional(),
      quantity: z.number().int().min(0).optional(),
      minStockLevel: z.number().int().min(0).optional(),
      unitPrice: z.number().min(0).optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.material.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.material.delete({ where: { id: input.id } })
    }),
})
