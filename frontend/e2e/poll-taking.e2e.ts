import { test, expect } from '@playwright/test'
import { loginViaUI, USER_CREDENTIALS } from './helpers/auth'

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

/**
 * Helper: create a public poll via API and return its slug.
 */
async function createTestPoll(
  page: import('@playwright/test').Page,
  accessToken: string,
): Promise<string> {
  const res = await page.request.post(`${API_BASE}/polls`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      title: 'E2E Test Poll',
      visibility: 'PUBLIC',
      questions: [
        {
          text: 'What is your favourite colour?',
          type: 'SINGLE_CHOICE',
          orderIndex: 0,
          isRequired: true,
          options: [
            { text: 'Red', orderIndex: 0 },
            { text: 'Blue', orderIndex: 1 },
          ],
        },
      ],
    },
  })
  const poll = await res.json() as { slug: string }
  return poll.slug
}

/**
 * Helper: log in via API and return access token.
 */
async function getAccessToken(
  page: import('@playwright/test').Page,
  credentials = USER_CREDENTIALS,
): Promise<string> {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: credentials,
  })
  const { accessToken } = await res.json() as { accessToken: string }
  return accessToken
}

test.describe('Poll Taking Flow', () => {
  test('anonymous submission sets cookie and shows thank-you', async ({ page }) => {
    const token = await getAccessToken(page)
    const slug = await createTestPoll(page, token)

    await page.goto(`/${slug}`)
    await expect(page.getByText('E2E Test Poll')).toBeVisible()

    // Select an option
    await page.getByLabel('Red').check()

    // Submit
    await page.getByRole('button', { name: /submit response/i }).click()

    // Thank-you state
    await expect(page.getByText('Thank you!')).toBeVisible()

    // Cookie should be set
    const cookies = await page.context().cookies()
    const respondedCookie = cookies.find((c) => c.name === `responded_${slug}`)
    expect(respondedCookie).toBeDefined()
    expect(respondedCookie?.value).toBe('true')
  })

  test('returning visitor sees already-responded state', async ({ page }) => {
    const token = await getAccessToken(page)
    const slug = await createTestPoll(page, token)

    // Set the cookie manually to simulate a returning visitor
    await page.goto(`/${slug}`)
    await page.context().addCookies([
      {
        name: `responded_${slug}`,
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto(`/${slug}`)
    await expect(page.getByText('Already responded')).toBeVisible()
    await expect(page.getByRole('button', { name: /submit response/i })).not.toBeVisible()
  })

  test('authenticated user can submit a response', async ({ page }) => {
    await loginViaUI(page, USER_CREDENTIALS)

    const token = await getAccessToken(page)
    const slug = await createTestPoll(page, token)

    await page.goto(`/${slug}`)
    await expect(page.getByText('E2E Test Poll')).toBeVisible()

    await page.getByLabel('Blue').check()
    await page.getByRole('button', { name: /submit response/i }).click()

    await expect(page.getByText('Thank you!')).toBeVisible()
  })

  test('rate-limit error is displayed in-form', async ({ page }) => {
    const token = await getAccessToken(page)
    const slug = await createTestPoll(page, token)

    // Submit once successfully
    await page.goto(`/${slug}`)
    await page.getByLabel('Red').check()
    await page.getByRole('button', { name: /submit response/i }).click()
    await expect(page.getByText('Thank you!')).toBeVisible()

    // Clear cookie to allow re-render of form (simulate different session)
    await page.context().clearCookies()
    await page.goto(`/${slug}`)

    // The server will return 409 for duplicate fingerprint
    await page.getByLabel('Red').check()
    await page.getByRole('button', { name: /submit response/i }).click()

    // Should show an in-form error (409 duplicate or similar)
    await expect(
      page.getByText(/already submitted|too many requests|expired/i),
    ).toBeVisible()
  })
})
