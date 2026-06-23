import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'

export const ticketRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assignedToId: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.status) where.status = input.status
      if (input?.priority) where.priority = input.priority
      if (input?.assignedToId) where.assignedToId = input.assignedToId
      if (input?.search) {
        where.OR = [
          { ticketNumber: { contains: input.search, mode: 'insensitive' } },
          { title: { contains: input.search, mode: 'insensitive' } },
          { customer: { name: { contains: input.search, mode: 'insensitive' } } },
        ]
      }
      const queryArgs = {
        where,
        include: {
          customer: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          asset: { select: { id: true, name: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { createdAt: 'desc' as const },
      }
      const [items, total] = await Promise.all([
        ctx.prisma.ticket.findMany({ ...queryArgs, skip, take }),
        ctx.prisma.ticket.count({ where }),
      ])
      return paginatedResult(items, total, page, pageSize)
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.ticket.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          customerLocation: true,
          assignedTo: true,
          asset: true,
          activities: { orderBy: { createdAt: 'asc' } },
          documents: true,
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      ticketNumber: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.string().default('OPEN'),
      priority: z.string().default('MEDIUM'),
      customerId: z.string(),
      customerLocationId: z.string().optional(),
      companyId: z.string(),
      assetId: z.string().optional(),
      assignedToId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.ticket.create({
        data: input as any,
        include: { activities: true },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assignedToId: z.string().optional(),
      resolvedAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
      closedAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.ticket.update({ where: { id }, data: data as any })
    }),

  addActivity: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      action: z.string(),
      description: z.string().optional(),
      createdBy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.ticketActivity.create({ data: input })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.ticket.delete({ where: { id: input.id } })
    }),
})
