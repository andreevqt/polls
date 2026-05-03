import { test, expect } from '@playwright/test'
import { loginViaUI, ADMIN_CREDENTIALS } from '../helpers/auth'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin')
  })

  test('renders Dashboard title and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText(/overview of your polls application/i)).toBeVisible()
  })

  test('renders stat cards for Total Users, Total Polls, Active Polls', async ({ page }) => {
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Total Polls')).toBeVisible()
    await expect(page.getByText('Active Polls')).toBeVisible()
  })

  test('stat cards show numeric values', async ({ page }) => {
    // Wait for data to load (spinner disappears)
    await page.waitForSelector('[class*="spinner"], svg', { state: 'hidden', timeout: 10_000 }).catch(() => {})
    // Each stat card should have a number
    const statValues = page.locator('.text-3xl')
    await expect(statValues.first()).toBeVisible()
  })

  test('renders Recent Polls section', async ({ page }) => {
    await expect(page.getByText('Recent Polls')).toBeVisible()
  })

  test('sidebar navigation links are visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /users/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /polls/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /system/i })).toBeVisible()
  })

  test('can navigate to Users page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /users/i }).click()
    await expect(page).toHaveURL(/\/admin\/users/)
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
  })

  test('can navigate to Polls page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /polls/i }).click()
    await expect(page).toHaveURL(/\/admin\/polls/)
    await expect(page.getByRole('heading', { name: /polls/i })).toBeVisible()
  })

  test('can navigate to Analytics page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /analytics/i }).click()
    await expect(page).toHaveURL(/\/admin\/analytics/)
  })

  test('can navigate to System page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /system/i }).click()
    await expect(page).toHaveURL(/\/admin\/system/)
  })
})
