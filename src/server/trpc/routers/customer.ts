import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../context'
import { filterImportableRows } from '@/lib/amc-excel-parser'
import { amcImportRowSchema, type AmcImportRow } from '@/lib/amc-import-schema'
import { createCustomerFromAmcRow, prepareCompaniesForImport, resolveOrCreateCompanyId } from '@/lib/customer-amc-create'
import { normalizeImportRow } from '@/lib/amc-import-utils'

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
      amcBilling: amcImportRowSchema
        .omit({ name: true, companyLabel: true, location: true })
        .optional(),
      amcCompanyLabel: z.string().optional(),
      amcLocation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const {
        locations,
        contactPersons,
        amcBilling,
        amcCompanyLabel,
        amcLocation,
        ...data
      } = input

      if (amcBilling) {
        const companies = await ctx.prisma.company.findMany({ where: { isActive: true } })
        const companyLabel = amcCompanyLabel ?? companies.find((c) => c.id === data.companyId)?.name ?? 'Logic'
        const location = amcLocation ?? locations[0]?.name ?? locations[0]?.city ?? 'Head Office'

        return createCustomerFromAmcRow(ctx.prisma, {
          row: {
            name: data.name,
            companyLabel,
            location,
            ...amcBilling,
            srNo: amcBilling.srNo ?? null,
          },
          companyId: data.companyId,
          industry: data.industry,
          gst: data.gst,
          pan: data.pan,
          billingAddress: data.billingAddress,
          contactPersons,
        })
      }

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
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'No company found. Add a company in Settings before importing customers.',
        })
      }

      const rows = filterImportableRows(
        input.rows.map((row) => normalizeImportRow({ ...row, srNo: row.srNo ?? null }))
      )
      if (!rows.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No importable customer rows found. The spreadsheet may only contain header rows.',
        })
      }

      const defaultCompanyId = input.defaultCompanyId ?? companies[0].id

      // Resolve company IDs up front and ensure AMC categories once per company (not per row).
      const rowCompanyIds = new Map<AmcImportRow, string>()
      for (const row of rows) {
        const companyId = await resolveOrCreateCompanyId(ctx.prisma, row.companyLabel || '', companies) || defaultCompanyId
        rowCompanyIds.set(row, companyId)
      }
      await prepareCompaniesForImport(ctx.prisma, [...rowCompanyIds.values()])

      let created = 0
      let skipped = 0
      const errors: string[] = []

      // Pre-load existing customers once to avoid per-row lookups during bulk import
      const existingCustomers = await ctx.prisma.customer.findMany({
        select: { companyId: true, name: true },
      })
      const existingKeys = new Set(
        existingCustomers.map((c) => `${c.companyId}:${c.name.trim().toLowerCase()}`)
      )

      for (const row of rows) {
        try {
          const companyId = rowCompanyIds.get(row) || defaultCompanyId

          if (input.skipExisting) {
            const key = `${companyId}:${row.name.trim().toLowerCase()}`
            if (existingKeys.has(key)) {
              skipped++
              continue
            }
          }

          await createCustomerFromAmcRow(ctx.prisma, {
            row: { ...row, srNo: row.srNo ?? null },
            companyId,
            skipCategoryEnsure: true,
          })

          existingKeys.add(`${companyId}:${row.name.trim().toLowerCase()}`)
          created++
        } catch (error) {
          errors.push(`${row.name}: ${error instanceof Error ? error.message : 'Import failed'}`)
        }
      }

      return { created, skipped, errors, total: rows.length }
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
