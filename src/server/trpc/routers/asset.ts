import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'

export const assetRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      assetType: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.assetType) where.assetType = input.assetType
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { serialNumber: { contains: input.search, mode: 'insensitive' } },
          { model: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      const queryArgs = {
        where,
        include: {
          customer: { select: { id: true, name: true } },
          customerLocation: { select: { id: true, name: true } },
          _count: { select: { tickets: true } },
        },
        orderBy: { createdAt: 'desc' as const },
      }
      const [items, total] = await Promise.all([
        ctx.prisma.asset.findMany({ ...queryArgs, skip, take }),
        ctx.prisma.asset.count({ where }),
      ])
      return paginatedResult(items, total, page, pageSize)
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.asset.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          customerLocation: true,
          tickets: { orderBy: { createdAt: 'desc' }, take: 10 },
          contracts: true,
          documents: true,
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      serialNumber: z.string().min(1),
      model: z.string().optional(),
      oem: z.string().optional(),
      assetType: z.string(),
      purchaseDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      installationDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      warrantyStart: z.string().optional().transform(v => v ? new Date(v) : undefined),
      warrantyEnd: z.string().optional().transform(v => v ? new Date(v) : undefined),
      amcStart: z.string().optional().transform(v => v ? new Date(v) : undefined),
      amcEnd: z.string().optional().transform(v => v ? new Date(v) : undefined),
      location: z.string().optional(),
      status: z.string().default('ACTIVE'),
      notes: z.string().optional(),
      customerId: z.string(),
      customerLocationId: z.string().optional(),
      companyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.asset.create({ data: input as any })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      serialNumber: z.string().min(1).optional(),
      model: z.string().optional(),
      oem: z.string().optional(),
      assetType: z.string().optional(),
      purchaseDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      installationDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
      warrantyStart: z.string().optional().transform(v => v ? new Date(v) : undefined),
      warrantyEnd: z.string().optional().transform(v => v ? new Date(v) : undefined),
      amcStart: z.string().optional().transform(v => v ? new Date(v) : undefined),
      amcEnd: z.string().optional().transform(v => v ? new Date(v) : undefined),
      location: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
      customerLocationId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.asset.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.asset.delete({ where: { id: input.id } })
    }),
})
