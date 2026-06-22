import { test, expect } from '@playwright/test'

const protectedRoutes: { path: string; heading: string | RegExp }[] = [
  { path: '/', heading: 'Overview' },
  { path: '/customers', heading: 'Customers' },
  { path: '/invoices', heading: 'Finance' },
  { path: '/search', heading: 'Search' },
  { path: '/assets', heading: 'Assets' },
  { path: '/contracts', heading: /Contract/i },
  { path: '/quotations', heading: /Quotation/i },
  { path: '/tickets', heading: /Ticket/i },
  { path: '/engineers', heading: /Engineer/i },
  { path: '/implementations', heading: /Implementation/i },
  { path: '/documents', heading: 'Documents' },
  { path: '/materials', heading: 'Materials' },
  { path: '/crm', heading: /CRM/i },
  { path: '/reports', heading: /Report/i },
  { path: '/settings', heading: /Setting/i },
]

const createRoutes: { path: string; title: string }[] = [
  { path: '/customers/new', title: 'New Customer' },
  { path: '/invoices/new', title: 'New Invoice' },
  { path: '/tickets/new', title: 'New Ticket' },
  { path: '/assets/new', title: 'New Asset' },
  { path: '/contracts/new', title: 'New Contract' },
  { path: '/quotations/new', title: 'New Quotation' },
  { path: '/engineers/new', title: 'New Engineer' },
  { path: '/implementations/new', title: 'New Implementation' },
]

test.describe('Protected module pages', () => {
  for (const route of protectedRoutes) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({ timeout: 20_000 })
    })
  }
})

test.describe('Create form routes', () => {
  for (const route of createRoutes) {
    test(`loads ${route.path} without 404`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.getByRole('heading', { name: route.title })).toBeVisible()
      await expect(page.getByText('404')).not.toBeVisible()
    })
  }
})

test.describe('Navigation shortcuts', () => {
  test('top bar new button opens customer create page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'New' }).click()
    await expect(page).toHaveURL('/customers/new')
    await expect(page.getByRole('heading', { name: 'New Customer' })).toBeVisible()
  })

  test('sidebar links work', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Customers' }).click()
    await expect(page).toHaveURL('/customers')
    await page.getByRole('link', { name: 'Finance' }).click()
    await expect(page).toHaveURL('/invoices')
    await page.getByRole('link', { name: 'Search' }).click()
    await expect(page).toHaveURL('/search')
  })
})
