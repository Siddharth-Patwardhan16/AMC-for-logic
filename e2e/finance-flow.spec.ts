import { expect, test } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function ensureFinanceCustomer() {
  const company = await prisma.company.upsert({
    where: { id: 'playwright-finance-company' },
    update: {
      name: 'Playwright Finance Pvt Ltd',
      isActive: true,
      invoicePrefix: 'PF-INV',
      quotationPrefix: 'PF-QOT',
    },
    create: {
      id: 'playwright-finance-company',
      name: 'Playwright Finance Pvt Ltd',
      isActive: true,
      invoicePrefix: 'PF-INV',
      quotationPrefix: 'PF-QOT',
    },
  })

  const existing = await prisma.customer.findFirst({
    where: { companyId: company.id, name: 'Playwright Finance Flow Customer' },
  })

  if (existing) return existing

  return prisma.customer.create({
    data: {
      name: 'Playwright Finance Flow Customer',
      industry: 'Testing',
      status: 'ACTIVE',
      billingAddress: 'Finance flow test address',
      companyId: company.id,
      contactPersons: {
        create: [{ name: 'Finance Flow Contact', email: 'flow@example.com', isPrimary: true }],
      },
      locations: {
        create: [{ name: 'Head Office', city: 'Pune', isHeadOffice: true }],
      },
    },
  })
}

test.afterAll(async () => {
  await prisma.$disconnect()
})

test.describe('Finance document flow', () => {
  test('creates an invoice, records payment, creates a quotation, and converts it', async ({ page }) => {
    const customer = await ensureFinanceCustomer()

    await page.goto(`/invoices/new?customerId=${customer.id}`)
    await expect(page.getByRole('heading', { name: 'New Invoice' })).toBeVisible()
    await expect(page.locator('select').nth(1)).toHaveValue(customer.id)

    const invoiceRow = page.locator('tbody tr').first()
    await invoiceRow.getByPlaceholder('Service, product, AMC item...').fill('Playwright invoice service')
    await invoiceRow.locator('input[type="number"]').nth(0).fill('2')
    await invoiceRow.locator('input[type="number"]').nth(1).fill('5000')
    await page.getByRole('button', { name: 'Create Invoice' }).click()

    await expect(page).toHaveURL(/\/invoices\/.+/)
    await expect(page.getByText('Playwright invoice service')).toBeVisible()
    await expect(page.getByText('Outstanding')).toBeVisible()

    await page.locator('form').last().locator('input[type="number"]').fill('11800')
    await page.getByRole('button', { name: 'Record payment' }).click()
    await expect(page.getByText('Settled')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('PAID').first()).toBeVisible()

    await page.goto(`/quotations/new?customerId=${customer.id}`)
    await expect(page.getByRole('heading', { name: 'New Quotation' })).toBeVisible()
    await expect(page.locator('select').nth(1)).toHaveValue(customer.id)

    const quotationRow = page.locator('tbody tr').first()
    await quotationRow.getByPlaceholder('Service, product, AMC item...').fill('Playwright quoted AMC')
    await quotationRow.locator('input[type="number"]').nth(0).fill('1')
    await quotationRow.locator('input[type="number"]').nth(1).fill('7000')
    await page.getByRole('button', { name: 'Create Quotation' }).click()

    await expect(page).toHaveURL(/\/quotations\/.+/)
    await expect(page.getByText('Playwright quoted AMC')).toBeVisible()
    await page.getByRole('button', { name: 'Create invoice' }).click()
    await expect(page).toHaveURL(/\/invoices\/.+/, { timeout: 15_000 })
    await expect(page.getByText('Playwright quoted AMC')).toBeVisible()
  })
})
