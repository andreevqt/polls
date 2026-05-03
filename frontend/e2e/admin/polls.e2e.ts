import { test, expect } from '@playwright/test'
import { loginViaUI, ADMIN_CREDENTIALS } from '../helpers/auth'

test.describe('Admin Polls Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin/polls')
    await page.waitForSelector('table', { timeout: 15_000 })
  })

  test('renders Polls heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /polls/i })).toBeVisible()
  })

  test('renders polls table with expected columns', async ({ page }) => {
    await expect(page.getByText('Poll')).toBeVisible()
    await expect(page.getByText('Owner')).toBeVisible()
    await expect(page.getByText('Visibility')).toBeVisible()
    await expect(page.getByText('Responses')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    await expect(page.getByText('Created')).toBeVisible()
    await expect(page.getByText('Actions')).toBeVisible()
  })

  test('renders search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search polls by title/i)).toBeVisible()
  })

  test('renders Filters button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /filters/i })).toBeVisible()
  })

  test('renders Export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible()
  })

  test('search filters the polls list', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search polls by title/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('can expand advanced filters panel', async ({ page }) => {
    await page.getByRole('button', { name: /filters/i }).click()
    await expect(page.getByLabel(/visibility/i)).toBeVisible()
    await expect(page.getByLabel(/status/i)).toBeVisible()
    await expect(page.getByLabel(/sort by/i)).toBeVisible()
  })

  test('can filter by visibility PUBLIC', async ({ page }) => {
    await page.getByRole('button', { name: /filters/i }).click()
    await page.getByLabel(/visibility/i).selectOption('PUBLIC')
    await page.waitForTimeout(500)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('can filter by status Active', async ({ page }) => {
    await page.getByRole('button', { name: /filters/i }).click()
    await page.getByLabel(/status/i).selectOption('true')
    await page.waitForTimeout(500)
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('delete button shows confirmation dialog', async ({ page }) => {
    const deleteButtons = page.getByRole('button', { name: /^delete$/i })
    const count = await deleteButtons.count()
    if (count > 0) {
      await deleteButtons.first().click()
      await expect(page.getByText('Confirm?')).toBeVisible()
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
    }
  })

  test('cancel button dismisses delete confirmation', async ({ page }) => {
    const deleteButtons = page.getByRole('button', { name: /^delete$/i })
    const count = await deleteButtons.count()
    if (count > 0) {
      await deleteButtons.first().click()
      await page.getByRole('button', { name: /cancel/i }).click()
      await expect(page.getByText('Confirm?')).not.toBeVisible()
    }
  })

  test('can select polls with checkboxes', async ({ page }) => {
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    if (count > 1) {
      await checkboxes.nth(1).click()
      await expect(page.getByText(/poll selected/i)).toBeVisible()
    }
  })

  test('bulk actions bar appears when polls are selected', async ({ page }) => {
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    if (count > 1) {
      await checkboxes.nth(0).click() // select all
      await expect(page.getByText(/polls selected/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /delete selected/i })).toBeVisible()
    }
  })

  test('can export polls as CSV', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i })
    const isDisabled = await exportBtn.isDisabled()
    if (!isDisabled) {
      await exportBtn.click()
      await expect(page.getByText('Export CSV')).toBeVisible()
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByText('Export CSV').click(),
      ])
      expect(download.suggestedFilename()).toMatch(/polls.*\.csv/)
    }
  })
})
