import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const dashboardRouter = router({
  stats: protectedProcedure
    .input(z.object({ companyId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const where = input?.companyId ? { companyId: input.companyId } : {}
      
      const [
        totalCustomers,
        activeCustomers,
        totalAssets,
        activeContracts,
        openTickets,
        pendingInvoices,
        totalRevenue,
        expiringContracts,
      ] = await Promise.all([
        ctx.prisma.customer.count({ where }),
        ctx.prisma.customer.count({ where: { ...where, status: 'ACTIVE' } }),
        ctx.prisma.asset.count({ where }),
        ctx.prisma.contract.count({ where: { ...where, status: 'ACTIVE' } }),
        ctx.prisma.ticket.count({ where: { ...where, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING'] } } }),
        ctx.prisma.invoice.count({ where: { ...where, status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } } }),
        ctx.prisma.invoice.aggregate({
          where: { ...where, status: 'PAID' },
          _sum: { totalAmount: true },
        }),
        ctx.prisma.contract.findMany({
          where: { ...where, status: 'ACTIVE', endDate: { lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } },
          include: { customer: { select: { name: true } } },
          orderBy: { endDate: 'asc' },
          take: 5,
        }),
      ])

      return {
        totalCustomers,
        activeCustomers,
        totalAssets,
        activeContracts,
        openTickets,
        pendingInvoices,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        expiringContracts,
      }
    }),

  revenueChart: protectedProcedure
    .input(z.object({ companyId: z.string(), months: z.number().default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const months = input?.months || 6
      const data = []
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const start = new Date(date.getFullYear(), date.getMonth(), 1)
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const revenue = await ctx.prisma.invoice.aggregate({
          where: {
            companyId: input?.companyId,
            status: 'PAID',
            issueDate: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
        })
        
        data.push({
          month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
          revenue: Number(revenue._sum.totalAmount || 0),
        })
      }
      return data
    }),

  recentActivity: protectedProcedure
    .input(z.object({ companyId: z.string(), limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 10
      const where = input?.companyId ? { companyId: input.companyId } : {}
      
      const [recentTickets, recentInvoices, recentCustomers] = await Promise.all([
        ctx.prisma.ticket.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { customer: { select: { name: true } } },
        }),
        ctx.prisma.invoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { customer: { select: { name: true } } },
        }),
        ctx.prisma.customer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ])

      return {
        tickets: recentTickets,
        invoices: recentInvoices,
        customers: recentCustomers,
      }
    }),
})
