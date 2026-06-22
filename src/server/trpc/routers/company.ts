import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const companyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const companies = await ctx.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return Promise.all(companies.map(async (company) => {
      const [customers, activeContracts, openTickets, pendingInvoices] = await Promise.all([
        ctx.prisma.customer.count({ where: { companyId: company.id } }),
        ctx.prisma.contract.count({ where: { companyId: company.id, status: 'ACTIVE' } }),
        ctx.prisma.ticket.count({
          where: {
            companyId: company.id,
            status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING'] },
          },
        }),
        ctx.prisma.invoice.count({
          where: {
            companyId: company.id,
            status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] },
          },
        }),
      ])

      const revenue = await ctx.prisma.invoice.aggregate({
        where: { companyId: company.id, status: 'PAID' },
        _sum: { totalAmount: true },
      })

      return {
        ...company,
        customers,
        activeContracts,
        openTickets,
        pendingInvoices,
        totalRevenue: revenue._sum.totalAmount ?? 0,
      }
    }))
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.company.findUnique({
        where: { id: input.id },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      logo: z.string().optional(),
      gstin: z.string().optional(),
      pan: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankBranch: z.string().optional(),
      signature: z.string().optional(),
      termsConditions: z.string().optional(),
      invoicePrefix: z.string().default('INV'),
      quotationPrefix: z.string().default('QOT'),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.company.create({ data: input as any })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      logo: z.string().optional(),
      gstin: z.string().optional(),
      pan: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankBranch: z.string().optional(),
      signature: z.string().optional(),
      termsConditions: z.string().optional(),
      invoicePrefix: z.string().optional(),
      quotationPrefix: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.company.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.company.delete({ where: { id: input.id } })
    }),
})
