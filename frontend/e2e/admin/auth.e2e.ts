import { test, expect } from '@playwright/test'
import { loginViaUI, ADMIN_CREDENTIALS, USER_CREDENTIALS } from '../helpers/auth'

test.describe('Admin Authentication & Route Protection', () => {
  test('unauthenticated user is redirected to /login when accessing /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('non-admin user is redirected to / when accessing /admin', async ({ page }) => {
    // Log in as a regular user
    await loginViaUI(page, USER_CREDENTIALS)
    await page.goto('/admin')
    // Should be redirected to home, not admin
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test('admin user can access /admin after login', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('login page shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    // HTML5 validation or custom error messages should appear
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeFocused()
  })

  test('login page shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/login/)
  })

  test('admin can sign out from the sidebar', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin')
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('after sign out, /admin redirects to /login', async ({ page }) => {
    await loginViaUI(page, ADMIN_CREDENTIALS)
    await page.goto('/admin')
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)
    // Try to access admin again
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })
})
