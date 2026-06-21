import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const documentRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      customerId: z.string().optional(),
      contractId: z.string().optional(),
      invoiceId: z.string().optional(),
      ticketId: z.string().optional(),
      assetId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.customerId) where.customerId = input.customerId
      if (input?.contractId) where.contractId = input.contractId
      if (input?.invoiceId) where.invoiceId = input.invoiceId
      if (input?.ticketId) where.ticketId = input.ticketId
      if (input?.assetId) where.assetId = input.assetId
      return ctx.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      fileType: z.string(),
      fileUrl: z.string(),
      fileSize: z.number().optional(),
      version: z.number().default(1),
      companyId: z.string(),
      customerId: z.string().optional(),
      contractId: z.string().optional(),
      invoiceId: z.string().optional(),
      quotationId: z.string().optional(),
      ticketId: z.string().optional(),
      assetId: z.string().optional(),
      implementationId: z.string().optional(),
      visitId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.document.create({ data: input as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.document.delete({ where: { id: input.id } })
    }),
})
