import { z } from 'zod'
import { protectedProcedure, router } from '../context'

export const customerRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input?.companyId) where.companyId = input.companyId
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { gst: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      return ctx.prisma.customer.findMany({
        where,
        include: {
          locations: true,
          contactPersons: true,
          _count: { select: { assets: true, contracts: true, tickets: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customer.findUnique({
        where: { id: input.id },
        include: {
          locations: true,
          contactPersons: true,
          assets: { include: { customerLocation: true } },
          contracts: { include: { billings: true } },
          tickets: { orderBy: { createdAt: 'desc' }, take: 10 },
          invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
          implementations: { orderBy: { implementDate: 'desc' } },
          crmActivities: { orderBy: { createdAt: 'desc' } },
          documents: { orderBy: { createdAt: 'desc' } },
          payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      })
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      industry: z.string().optional(),
      gst: z.string().optional(),
      pan: z.string().optional(),
      billingAddress: z.string().optional(),
      shippingAddress: z.string().optional(),
      status: z.string().default('LEAD'),
      notes: z.string().optional(),
      tags: z.array(z.string()).default([]),
      companyId: z.string(),
      locations: z.array(z.object({
        name: z.string(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        isHeadOffice: z.boolean().default(false),
      })).default([]),
      contactPersons: z.array(z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        designation: z.string().optional(),
        isPrimary: z.boolean().default(false),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { locations, contactPersons, ...data } = input
      return ctx.prisma.customer.create({
        data: {
          ...data,
          locations: { create: locations },
          contactPersons: { create: contactPersons },
        } as any,
        include: {
          locations: true,
          contactPersons: true,
        },
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      industry: z.string().optional(),
      gst: z.string().optional(),
      pan: z.string().optional(),
      billingAddress: z.string().optional(),
      shippingAddress: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.customer.update({ where: { id }, data: data as any })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customer.delete({ where: { id: input.id } })
    }),
})
