import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const crmRouter = router({
  listActivities: protectedProcedure
    .input(z.object({
      customerId: z.string().optional(),
      activityType: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.customerId) where.customerId = input.customerId
      if (input?.activityType) where.activityType = input.activityType
      if (input?.status) where.status = input.status
      return ctx.prisma.cRMActivity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      })
    }),

  createActivity: protectedProcedure
    .input(z.object({
      activityType: z.string(),
      subject: z.string().min(1),
      description: z.string().optional(),
      scheduledAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
      customerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.cRMActivity.create({ data: input as any })
    }),

  updateActivity: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.string().optional(),
      completedAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.cRMActivity.update({ where: { id }, data: data as any })
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.cRMActivity.delete({ where: { id: input.id } })
    }),

  pipeline: protectedProcedure
    .input(z.object({ companyId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const where = input?.companyId ? { companyId: input.companyId } : {}
      const [leads, prospects, active, closed] = await Promise.all([
        ctx.prisma.customer.count({ where: { ...where, status: 'LEAD' } }),
        ctx.prisma.customer.count({ where: { ...where, status: 'PROSPECT' } }),
        ctx.prisma.customer.count({ where: { ...where, status: 'ACTIVE' } }),
        ctx.prisma.customer.count({ where: { ...where, status: 'CLOSED' } }),
      ])
      return { leads, prospects, active, closed }
    }),
})
