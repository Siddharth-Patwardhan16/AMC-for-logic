import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { adminProcedure, protectedProcedure, router } from '../context'
import { paginatedResult, paginationFields, resolvePagination } from '@/lib/pagination'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  phone: true,
  avatar: true,
  createdAt: true,
  lastLoginAt: true,
} as const

const userRoles = ['ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTS', 'VIEWER'] as const

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
      const where: Record<string, unknown> = {}
      if (input?.role) where.role = input.role
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take,
          select: {
            ...userSelect,
            _count: {
              select: {
                assignedTickets: true,
                visits: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        }),
        ctx.prisma.user.count({ where }),
      ])

      return paginatedResult(items, total, page, pageSize)
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          ...userSelect,
          assignedTickets: { orderBy: { createdAt: 'desc' }, take: 10 },
          visits: { orderBy: { visitDate: 'desc' }, take: 10 },
        },
      })
    }),

  create: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(6),
      role: z.enum(userRoles).default('ENGINEER'),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase()
      const existing = await ctx.prisma.user.findUnique({ where: { email } })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'A user with this email already exists' })
      }

      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(input.password, 12)
      return ctx.prisma.user.create({
        data: {
          email,
          name: input.name.trim(),
          password: hashedPassword,
          role: input.role,
          phone: input.phone,
          status: 'ACTIVE',
        },
        select: userSelect,
      })
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.enum(userRoles).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, email, ...data } = input

      if (email) {
        const normalized = email.trim().toLowerCase()
        const existing = await ctx.prisma.user.findFirst({
          where: { email: normalized, NOT: { id } },
        })
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'A user with this email already exists' })
        }
      }

      return ctx.prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(email ? { email: email.trim().toLowerCase() } : {}),
        },
        select: userSelect,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user!.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot delete your own account' })
      }

      return ctx.prisma.user.delete({ where: { id: input.id } })
    }),
})
