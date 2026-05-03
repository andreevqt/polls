import { test, expect } from '@playwright/test'
import { loginViaUI, ADMIN_CREDENTIALS } from '../helpers/auth'

test.describe('Admin Users Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin/users')
    // Wait for the table to load
    await page.waitForSelector('table', { timeout: 15_000 })
  })

  test('renders Users heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
  })

  test('renders user table with expected columns', async ({ page }) => {
    await expect(page.getByText('User')).toBeVisible()
    await expect(page.getByText('Role')).toBeVisible()
    await expect(page.getByText('Joined')).toBeVisible()
    await expect(page.getByText('Actions')).toBeVisible()
  })

  test('renders search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search by name or email/i)).toBeVisible()
  })

  test('renders Filters button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /filters/i })).toBeVisible()
  })

  test('renders Export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible()
  })

  test('search filters the user list', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search by name or email/i)
    await searchInput.fill('admin')
    // Wait for debounce / re-fetch
    await page.waitForTimeout(500)
    // The table should still be visible
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('can expand advanced filters panel', async ({ page }) => {
    await page.getByRole('button', { name: /filters/i }).click()
    await expect(page.getByLabel(/role/i)).toBeVisible()
    await expect(page.getByLabel(/sort by/i)).toBeVisible()
    await expect(page.getByLabel(/order/i)).toBeVisible()
  })

  test('can filter by role ADMIN', async ({ page }) => {
    await page.getByRole('button', { name: /filters/i }).click()
    await page.getByLabel(/role/i).selectOption('ADMIN')
    await page.waitForTimeout(500)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('can select a user with checkbox', async ({ page }) => {
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    if (count > 1) {
      await checkboxes.nth(1).click()
      await expect(page.getByText(/user selected/i)).toBeVisible()
    }
  })

  test('bulk actions bar appears when users are selected', async ({ page }) => {
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    if (count > 1) {
      await checkboxes.nth(0).click() // select all
      await expect(page.getByText(/users selected/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /set admin/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /delete selected/i })).toBeVisible()
    }
  })

  test('can export users as CSV', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i })
    const isDisabled = await exportBtn.isDisabled()
    if (!isDisabled) {
      await exportBtn.click()
      await expect(page.getByText('Export CSV')).toBeVisible()
      // Set up download listener
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByText('Export CSV').click(),
      ])
      expect(download.suggestedFilename()).toMatch(/users.*\.csv/)
    }
  })

  test('can export users as JSON', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i })
    const isDisabled = await exportBtn.isDisabled()
    if (!isDisabled) {
      await exportBtn.click()
      await expect(page.getByText('Export JSON')).toBeVisible()
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByText('Export JSON').click(),
      ])
      expect(download.suggestedFilename()).toMatch(/users.*\.json/)
    }
  })
})
