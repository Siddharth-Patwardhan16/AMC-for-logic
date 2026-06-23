import { TRPCError } from '@trpc/server'
import type { Prisma } from '@prisma/client'

function currentFiscalYear(date = new Date()) {
  const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1

  return {
    label: `${startYear}-${String(startYear + 1).slice(-2)}`,
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 3, 1),
  }
}

function formatNumber(prefix: string, fiscalYear: string, sequence: number) {
  return `${prefix}/${fiscalYear}/${String(sequence).padStart(4, '0')}`
}

export async function getNextInvoiceNumber(
  prisma: Prisma.TransactionClient,
  companyId: string,
  date = new Date(),
) {
  const fiscalYear = currentFiscalYear(date)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { invoicePrefix: true },
  })

  if (!company) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
  }

  const count = await prisma.invoice.count({
    where: {
      companyId,
      issueDate: { gte: fiscalYear.start, lt: fiscalYear.end },
    },
  })

  return formatNumber(company.invoicePrefix || 'INV', fiscalYear.label, count + 1)
}

export async function getNextQuotationNumber(
  prisma: Prisma.TransactionClient,
  companyId: string,
  date = new Date(),
) {
  const fiscalYear = currentFiscalYear(date)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { quotationPrefix: true },
  })

  if (!company) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
  }

  const count = await prisma.quotation.count({
    where: {
      companyId,
      createdAt: { gte: fiscalYear.start, lt: fiscalYear.end },
    },
  })

  return formatNumber(company.quotationPrefix || 'QOT', fiscalYear.label, count + 1)
}
