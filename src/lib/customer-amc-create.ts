import { randomUUID } from 'crypto'
import type { PrismaClient } from '@prisma/client'
import { buildAmcNotes, resolveCompanyId } from '@/lib/amc-excel-parser'
import type { AmcImportRow } from '@/lib/amc-import-schema'
import { createAmcScheduleFromRow } from '@/lib/amc-schedule-import'
import { ensureDefaultCategories } from '@/lib/amc-schedule-sync'

type DbClient = Pick<PrismaClient, 'customer' | 'company' | 'amcCategory' | '$transaction'>

const FY_START = new Date('2026-04-01')
const FY_END = new Date('2027-03-31')

export type CreateCustomerFromAmcParams = {
  row: AmcImportRow
  companyId: string
  industry?: string
  gst?: string
  pan?: string
  billingAddress?: string
  createdById?: string
  contactPersons?: {
    name: string
    email?: string
    phone?: string
    designation?: string
    isPrimary?: boolean
  }[]
  skipCategoryEnsure?: boolean
}

export async function prepareCompaniesForImport(
  prisma: Pick<PrismaClient, 'amcCategory'>,
  companyIds: string[]
) {
  const unique = [...new Set(companyIds)]
  await Promise.all(unique.map((id) => ensureDefaultCategories(prisma, id)))
}

export async function createCustomerFromAmcRow(
  prisma: DbClient,
  {
    row,
    companyId,
    industry,
    gst,
    pan,
    billingAddress,
    contactPersons = [],
    skipCategoryEnsure = false,
    createdById,
  }: CreateCustomerFromAmcParams
) {
  const contractValue = row.yearlyAmount > 0 ? row.yearlyAmount : row.quarterlyTotal * 4
  const contractNumber = `AMC-26-27-${randomUUID().slice(0, 8)}`

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        name: row.name.trim(),
        industry,
        gst,
        pan,
        billingAddress,
        shippingAddress: billingAddress,
        status: 'ACTIVE',
        notes: buildAmcNotes(row),
        tags: ['amc-import', row.section?.toLowerCase().replace(/\s+/g, '-') ?? 'q1'],
        companyId,
        createdById,
        locations: {
          create: [{
            name: row.location || 'Head Office',
            city: row.location,
            isHeadOffice: true,
          }],
        },
        contactPersons: contactPersons.length ? { create: contactPersons } : undefined,
        contracts: contractValue > 0 ? {
          create: [{
            contractNumber,
            contractType: 'YEARLY_AMC',
            status: 'ACTIVE',
            startDate: FY_START,
            endDate: FY_END,
            value: contractValue,
            billingFrequency: 'QUARTERLY',
            companyId,
          }],
        } : undefined,
      },
      select: {
        id: true,
        name: true,
        contracts: { select: { id: true } },
      },
    })

    const contractId = customer.contracts[0]?.id
    await createAmcScheduleFromRow(tx, {
      customerId: customer.id,
      companyId,
      contractId,
      row,
      skipCategoryEnsure,
    })

    return customer
  })
}

/** Find exact company name or create one using the spreadsheet label as-is. */
export async function resolveOrCreateCompanyId(
  prisma: Pick<PrismaClient, 'company'>,
  label: string,
  companies: { id: string; name: string }[]
): Promise<string | null> {
  const name = label.trim()
  if (!name) return null

  const existing = resolveCompanyId(name, companies)
  if (existing) return existing

  const fromDb = await prisma.company.findFirst({
    where: {
      isActive: true,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true, name: true },
  })
  if (fromDb) {
    companies.push(fromDb)
    return fromDb.id
  }

  try {
    const createdCompany = await prisma.company.create({
      data: { name, isActive: true },
    })
    companies.push(createdCompany)
    return createdCompany.id
  } catch {
    const retry = await prisma.company.findFirst({
      where: {
        isActive: true,
        name: { equals: name, mode: 'insensitive' },
      },
      select: { id: true, name: true },
    })
    if (retry) {
      companies.push(retry)
      return retry.id
    }
    throw new Error(`Could not create company "${name}"`)
  }
}
