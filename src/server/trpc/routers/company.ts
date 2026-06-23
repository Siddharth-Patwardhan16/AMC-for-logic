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
    const [
      companies,
      customerCounts,
      activeContractCounts,
      openTicketCounts,
      pendingInvoiceCounts,
      revenueSums,
    ] = await Promise.all([
      ctx.prisma.company.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      ctx.prisma.customer.groupBy({
        by: ['companyId'],
        _count: { _all: true },
      }),
      ctx.prisma.contract.groupBy({
        by: ['companyId'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
      ctx.prisma.ticket.groupBy({
        by: ['companyId'],
        where: {
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING'] },
        },
        _count: { _all: true },
      }),
      ctx.prisma.invoice.groupBy({
        by: ['companyId'],
        where: {
          status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] },
        },
        _count: { _all: true },
      }),
      ctx.prisma.invoice.groupBy({
        by: ['companyId'],
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
    ])

    const countByCompany = (rows: { companyId: string; _count: { _all: number } }[]) =>
      new Map(rows.map((row) => [row.companyId, row._count._all]))

    const customersMap = countByCompany(customerCounts)
    const contractsMap = countByCompany(activeContractCounts)
    const ticketsMap = countByCompany(openTicketCounts)
    const pendingMap = countByCompany(pendingInvoiceCounts)
    const revenueMap = new Map(
      revenueSums.map((row) => [row.companyId, row._sum.totalAmount ?? 0])
    )

    return companies.map((company) => ({
      ...company,
      customers: customersMap.get(company.id) ?? 0,
      activeContracts: contractsMap.get(company.id) ?? 0,
      openTickets: ticketsMap.get(company.id) ?? 0,
      pendingInvoices: pendingMap.get(company.id) ?? 0,
      totalRevenue: revenueMap.get(company.id) ?? 0,
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
