import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('admin@example.com').fill('admin@example.com')
  await page.getByPlaceholder('••••••••').fill('admin123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 15_000 })
  await page.context().storageState({ path: authFile })
})
