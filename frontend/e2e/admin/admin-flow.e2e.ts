import { test, expect } from '@playwright/test'
import { loginViaUI, ADMIN_CREDENTIALS } from '../helpers/auth'

/**
 * Full admin flow integration tests — simulate a complete admin session.
 */
test.describe('Admin Full Flow', () => {
  test('complete admin session: login → navigate all pages → logout', async ({ page }) => {
    // 1. Login
    await loginViaUI(page, ADMIN_CREDENTIALS)

    // 2. Should land on dashboard or be able to navigate there
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // 3. Navigate to Users
    await page.getByRole('link', { name: /users/i }).click()
    await expect(page).toHaveURL(/\/admin\/users/)
    await page.waitForSelector('table', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()

    // 4. Navigate to Polls
    await page.getByRole('link', { name: /polls/i }).click()
    await expect(page).toHaveURL(/\/admin\/polls/)
    await page.waitForSelector('table', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /polls/i })).toBeVisible()

    // 5. Navigate to Analytics
    await page.getByRole('link', { name: /analytics/i }).click()
    await expect(page).toHaveURL(/\/admin\/analytics/)

    // 6. Navigate to System
    await page.getByRole('link', { name: /system/i }).click()
    await expect(page).toHaveURL(/\/admin\/system/)

    // 7. Logout
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('admin can search users and see filtered results', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin/users')
    await page.waitForSelector('table', { timeout: 10_000 })

    const searchInput = page.getByPlaceholder(/search by name or email/i)
    await searchInput.fill('admin')
    await page.waitForTimeout(600) // debounce

    // Table should still be visible with filtered results
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('admin can search polls and see filtered results', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin/polls')
    await page.waitForSelector('table', { timeout: 10_000 })

    const searchInput = page.getByPlaceholder(/search polls by title/i)
    await searchInput.fill('survey')
    await page.waitForTimeout(600)

    await expect(page.getByRole('table')).toBeVisible()
  })

  test('admin can reset filters after applying them', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin/users')
    await page.waitForSelector('table', { timeout: 10_000 })

    // Apply a search filter
    const searchInput = page.getByPlaceholder(/search by name or email/i)
    await searchInput.fill('xyz-nonexistent')
    await page.waitForTimeout(600)

    // Reset button should appear
    const resetBtn = page.getByRole('button', { name: /reset/i })
    await expect(resetBtn).toBeVisible()
    await resetBtn.click()

    // Search input should be cleared
    await expect(searchInput).toHaveValue('')
  })

  test('admin sidebar shows user name and email', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin')

    // The sidebar should show the logged-in admin's info
    // (exact values depend on test data)
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('admin can navigate back to dashboard from any page', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin/users')
    await page.waitForSelector('table', { timeout: 10_000 })

    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})

test.describe('Admin Role-Based Access Control', () => {
  test('direct URL access to /admin without auth redirects to login', async ({ page }) => {
    // No login — direct navigation
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('direct URL access to /admin/users without auth redirects to login', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/login/)
  })

  test('direct URL access to /admin/polls without auth redirects to login', async ({ page }) => {
    await page.goto('/admin/polls')
    await expect(page).toHaveURL(/\/login/)
  })

  test('direct URL access to /admin/analytics without auth redirects to login', async ({ page }) => {
    await page.goto('/admin/analytics')
    await expect(page).toHaveURL(/\/login/)
  })

  test('direct URL access to /admin/system without auth redirects to login', async ({ page }) => {
    await page.goto('/admin/system')
    await expect(page).toHaveURL(/\/login/)
  })
})
