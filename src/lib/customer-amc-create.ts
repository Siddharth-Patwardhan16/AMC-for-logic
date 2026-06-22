import { randomUUID } from 'crypto'
import type { PrismaClient } from '@prisma/client'
import { buildAmcNotes, resolveCompanyId } from '@/lib/amc-excel-parser'
import type { AmcImportRow } from '@/lib/amc-import-schema'
import { createAmcScheduleFromRow } from '@/lib/amc-schedule-import'

type DbClient = Pick<PrismaClient, 'customer' | 'company' | '$transaction'>

const FY_START = new Date('2026-04-01')
const FY_END = new Date('2027-03-31')

export type CreateCustomerFromAmcParams = {
  row: AmcImportRow
  companyId: string
  industry?: string
  gst?: string
  pan?: string
  billingAddress?: string
  contactPersons?: {
    name: string
    email?: string
    phone?: string
    designation?: string
    isPrimary?: boolean
  }[]
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
      include: {
        locations: true,
        contactPersons: true,
        contracts: true,
      },
    })

    const contractId = customer.contracts[0]?.id
    await createAmcScheduleFromRow(tx, {
      customerId: customer.id,
      companyId,
      contractId,
      row,
    })

    return customer
  })
}

export async function resolveOrCreateCompanyId(
  prisma: Pick<PrismaClient, 'company'>,
  label: string,
  companies: { id: string; name: string }[]
): Promise<string> {
  const resolved = resolveCompanyId(label, companies)
  if (resolved) return resolved

  const name = label.trim() || 'Imported'
  const createdCompany = await prisma.company.create({
    data: { name, isActive: true },
  })
  companies.push(createdCompany)
  return createdCompany.id
}
