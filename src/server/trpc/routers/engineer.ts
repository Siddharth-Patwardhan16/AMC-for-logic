import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'

export const engineerRouter = router({
  list: protectedProcedure
    .input(z.object({
      role: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      ...paginationFields,
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page, pageSize, skip, take } = resolvePagination(input ?? undefined)
      const where: any = {}
      if (input?.role) where.role = input.role
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      const queryArgs = {
        where,
        include: {
          _count: {
            select: {
              assignedTickets: true,
              visits: true,
            },
          },
        },
        orderBy: { name: 'asc' as const },
      }
      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({ ...queryArgs, skip, take }),
        ctx.prisma.user.count({ where }),
      ])
      return paginatedResult(items, total, page, pageSize)
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          assignedTickets: { orderBy: { createdAt: 'desc' }, take: 10 },
          visits: { orderBy: { visitDate: 'desc' }, take: 10 },
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(6),
      role: z.string().default('ENGINEER'),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(input.password, 12)
      return ctx.prisma.user.create({
        data: { ...input, password: hashedPassword } as any,
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.string().optional(),
      status: z.string().optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.user.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.delete({ where: { id: input.id } })
    }),
})
