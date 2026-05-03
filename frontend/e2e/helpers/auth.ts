import type { Page } from '@playwright/test'

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export interface TestCredentials {
  email: string
  password: string
}

export const ADMIN_CREDENTIALS: TestCredentials = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'Admin1234!',
}

export const USER_CREDENTIALS: TestCredentials = {
  email: process.env.E2E_USER_EMAIL ?? 'user@example.com',
  password: process.env.E2E_USER_PASSWORD ?? 'User1234!',
}

/**
 * Log in via the UI login form.
 */
export async function loginViaUI(
  page: Page,
  credentials: TestCredentials = ADMIN_CREDENTIALS,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(credentials.email)
  await page.getByLabel(/password/i).fill(credentials.password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 })
}

/**
 * Log in via API (faster — bypasses UI) and inject the access token into
 * the Zustand store via localStorage/sessionStorage workaround.
 */
export async function loginViaAPI(
  page: Page,
  credentials: TestCredentials = ADMIN_CREDENTIALS,
): Promise<void> {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: credentials.email, password: credentials.password },
  })

  if (!response.ok()) {
    throw new Error(
      `Login failed: ${response.status()} ${await response.text()}`,
    )
  }

  const { user, accessToken } = await response.json() as {
    user: { id: string; name: string; email: string; role: string; createdAt: string }
    accessToken: string
  }

  // Navigate to the app first so we can execute scripts in its context
  await page.goto('/')

  // Inject auth state into the Zustand store via window
  await page.evaluate(
    ({ user: u, token }) => {
      // The Zustand store is accessible via the global store reference
      // We set it directly in localStorage as a fallback mechanism
      const authState = JSON.stringify({ state: { user: u, accessToken: token, isInitialized: true } })
      sessionStorage.setItem('auth-store', authState)
      // Trigger a storage event so Zustand picks it up if configured
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth-store', newValue: authState }))
    },
    { user, token: accessToken },
  )
}

/**
 * Log out via the sidebar Sign out button.
 */
export async function logoutViaUI(page: Page): Promise<void> {
  await page.getByRole('button', { name: /sign out/i }).click()
  await page.waitForURL('**/login')
}
