import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, router } from '../context'
import { filterImportableRows } from '@/lib/amc-excel-parser'
import { amcImportRowSchema } from '@/lib/amc-import-schema'
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
        const companyLabel = amcCompanyLabel?.trim()
        const location = amcLocation ?? locations[0]?.name ?? locations[0]?.city ?? 'Head Office'

        let companyId = data.companyId
        if (companyLabel) {
          const resolved = await resolveOrCreateCompanyId(ctx.prisma, companyLabel, companies)
          if (resolved) companyId = resolved
        }

        return createCustomerFromAmcRow(ctx.prisma, {
          row: {
            name: data.name,
            companyLabel: companyLabel || companies.find((c) => c.id === companyId)?.name || 'Logic',
            location,
            ...amcBilling,
            srNo: amcBilling.srNo ?? null,
          },
          companyId,
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
      const companies = await ctx.prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      })

      const rows = filterImportableRows(
        input.rows.map((row) => normalizeImportRow({ ...row, srNo: row.srNo ?? null }))
      )
      if (!rows.length) {
        if (input.rows.length > 0) {
          return { created: 0, skipped: 0, errors: [], total: 0 }
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No importable customer rows found. The spreadsheet may only contain header rows.',
        })
      }

      const fallbackCompanyLabel =
        rows.map((row) => row.companyLabel.trim()).find(Boolean) || 'Logic'

      const companyIdByLabel = new Map<string, string>()
      for (const row of rows) {
        const label = row.companyLabel.trim() || fallbackCompanyLabel
        if (companyIdByLabel.has(label)) continue
        const companyId = await resolveOrCreateCompanyId(ctx.prisma, label, companies)
        if (!companyId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Could not resolve company "${label}"`,
          })
        }
        companyIdByLabel.set(label, companyId)
      }

      await prepareCompaniesForImport(ctx.prisma, [...companyIdByLabel.values()])

      let created = 0
      let skipped = 0
      const errors: string[] = []

      const existingCustomers = await ctx.prisma.customer.findMany({
        select: { companyId: true, name: true },
      })
      const existingKeys = new Set(
        existingCustomers.map((c) => `${c.companyId}:${c.name.trim().toLowerCase()}`)
      )

      for (const row of rows) {
        try {
          const label = row.companyLabel.trim() || fallbackCompanyLabel
          const companyId = companyIdByLabel.get(label)!

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
