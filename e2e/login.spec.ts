import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('redirects unauthenticated dashboard access to login', async ({ page }) => {
    await page.goto('/customers')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logs in with demo credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('admin@example.com').fill('admin@example.com')
    await page.getByPlaceholder('••••••••').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  })
})
