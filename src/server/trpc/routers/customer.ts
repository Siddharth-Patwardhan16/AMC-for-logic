import { z } from 'zod'
import { protectedProcedure, router } from '../context'
import { buildAmcNotes, resolveCompanyId } from '@/lib/amc-excel-parser'
import { createAmcScheduleFromRow } from '@/lib/amc-schedule-import'

const amcImportRowSchema = z.object({
  srNo: z.number().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  companyLabel: z.string(),
  location: z.string(),
  serverRateYearly: z.number(),
  serverRateQuarterly: z.number(),
  sophosQuantity: z.number(),
  sophosRateYearly: z.number(),
  sophosRateQuarterly: z.number(),
  serverQtyQ1: z.number(),
  serverQtyQ2: z.number(),
  serverQtyQ3: z.number(),
  serverQtyQ4: z.number(),
  thinClientRateYearly: z.number(),
  thinClientRateQuarterly: z.number(),
  thinClientQtyQ1: z.number(),
  thinClientQtyQ2: z.number(),
  thinClientQtyQ3: z.number(),
  thinClientQtyQ4: z.number(),
  laptopDesktopRateYearly: z.number(),
  laptopDesktopRateQuarterly: z.number(),
  laptopDesktopQtyQ1: z.number(),
  laptopDesktopQtyQ2: z.number(),
  laptopDesktopQtyQ3: z.number(),
  laptopDesktopQtyQ4: z.number(),
  amountQ1: z.number(),
  amountQ2: z.number(),
  amountQ3: z.number(),
  amountQ4: z.number(),
  quarterlyTotal: z.number(),
  yearlyAmount: z.number(),
  section: z.string().optional(),
})

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
          { industry: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      return ctx.prisma.customer.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
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
          company: { select: { id: true, name: true } },
          locations: true,
          contactPersons: true,
          assets: { include: { customerLocation: true } },
          contracts: { include: { billings: true } },
          amcSchedules: {
            include: {
              company: { select: { id: true, name: true } },
              lineItems: { include: { addons: true } },
              installments: { include: { payments: true }, orderBy: { quarter: 'asc' } },
            },
            orderBy: { fiscalYear: 'desc' },
          },
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

  importAmcSpreadsheet: protectedProcedure
    .input(z.object({
      rows: z.array(amcImportRowSchema),
      defaultCompanyId: z.string().optional(),
      skipExisting: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const companies = await ctx.prisma.company.findMany({ where: { isActive: true } })
      if (!companies.length) {
        throw new Error('No company found. Add a company in Settings before importing customers.')
      }

      const defaultCompanyId = input.defaultCompanyId ?? companies[0].id
      const fyStart = new Date('2026-04-01')
      const fyEnd = new Date('2027-03-31')

      let created = 0
      let skipped = 0
      const errors: string[] = []

      for (const row of input.rows) {
        try {
          const companyId =
            resolveCompanyId(row.companyLabel, companies) ??
            defaultCompanyId

          if (input.skipExisting) {
            const existing = await ctx.prisma.customer.findFirst({
              where: {
                companyId,
                name: { equals: row.name, mode: 'insensitive' },
              },
            })
            if (existing) {
              skipped++
              continue
            }
          }

          const contractValue = row.yearlyAmount > 0 ? row.yearlyAmount : row.quarterlyTotal * 4
          const contractNumber = `AMC-${new Date().getFullYear()}-${String(created + skipped + 1).padStart(4, '0')}`

          const customer = await ctx.prisma.customer.create({
            data: {
              name: row.name.trim(),
              status: 'ACTIVE',
              notes: buildAmcNotes({ ...row, srNo: row.srNo ?? null }),
              tags: ['amc-import', row.section?.toLowerCase().replace(/\s+/g, '-') ?? 'q1'],
              companyId,
              locations: {
                create: [{
                  name: row.location || 'Head Office',
                  city: row.location,
                  isHeadOffice: true,
                }],
              },
              contracts: contractValue > 0 ? {
                create: [{
                  contractNumber,
                  contractType: 'YEARLY_AMC',
                  status: 'ACTIVE',
                  startDate: fyStart,
                  endDate: fyEnd,
                  value: contractValue,
                  billingFrequency: 'QUARTERLY',
                  companyId,
                }],
              } : undefined,
            },
            include: { contracts: true },
          })

          const contractId = customer.contracts[0]?.id
          await createAmcScheduleFromRow(ctx.prisma, {
            customerId: customer.id,
            companyId,
            contractId,
            row: { ...row, srNo: row.srNo ?? null },
          })

          created++
        } catch (error) {
          errors.push(`${row.name}: ${error instanceof Error ? error.message : 'Import failed'}`)
        }
      }

      return { created, skipped, errors, total: input.rows.length }
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
