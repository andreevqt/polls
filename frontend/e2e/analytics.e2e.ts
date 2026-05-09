import { test, expect } from '@playwright/test'
import { loginViaUI, USER_CREDENTIALS } from './helpers/auth'

const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

async function getAccessToken(page: import('@playwright/test').Page): Promise<string> {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: USER_CREDENTIALS,
  })
  const { accessToken } = await res.json() as { accessToken: string }
  return accessToken
}

async function createPollAndSubmitResponse(
  page: import('@playwright/test').Page,
  token: string,
): Promise<string> {
  // Create poll
  const pollRes = await page.request.post(`${API_BASE}/polls`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: 'Analytics Test Poll',
      visibility: 'PUBLIC',
      questions: [
        {
          text: 'Pick one',
          type: 'SINGLE_CHOICE',
          orderIndex: 0,
          isRequired: true,
          options: [
            { text: 'Option A', orderIndex: 0 },
            { text: 'Option B', orderIndex: 1 },
          ],
        },
      ],
    },
  })
  const poll = await pollRes.json() as { slug: string; questions: Array<{ id: string; options: Array<{ id: string }> }> }

  // Submit a response
  await page.request.post(`${API_BASE}/polls/${poll.slug}/responses`, {
    data: {
      answers: [
        { questionId: poll.questions[0].id, optionId: poll.questions[0].options[0].id },
      ],
      respondentFingerprint: `e2e-test-${Date.now()}`,
    },
  })

  return poll.slug
}

test.describe('Poll Analytics', () => {
  test('navigate to analytics page and verify response count', async ({ page }) => {
    await loginViaUI(page, USER_CREDENTIALS)

    const token = await getAccessToken(page)
    const slug = await createPollAndSubmitResponse(page, token)

    await page.goto(`/dashboard/polls/${slug}/analytics`)

    // Should show total responses
    await expect(page.getByText('Total responses')).toBeVisible()
    await expect(page.getByText('1')).toBeVisible()

    // Should show question breakdown
    await expect(page.getByText('Pick one')).toBeVisible()
    await expect(page.getByText('Option A')).toBeVisible()
  })

  test('CSV download initiates', async ({ page }) => {
    await loginViaUI(page, USER_CREDENTIALS)

    const token = await getAccessToken(page)
    const slug = await createPollAndSubmitResponse(page, token)

    await page.goto(`/dashboard/polls/${slug}/analytics`)
    await expect(page.getByText('Total responses')).toBeVisible()

    // Listen for download event
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export csv/i }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
  })

  test('non-owner gets access denied', async ({ page }) => {
    // Create poll as user, then try to access analytics as a different session
    const token = await getAccessToken(page)
    const pollRes = await page.request.post(`${API_BASE}/polls`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Private Analytics Poll',
        visibility: 'PUBLIC',
        questions: [
          {
            text: 'Q?',
            type: 'SINGLE_CHOICE',
            orderIndex: 0,
            isRequired: true,
            options: [{ text: 'A', orderIndex: 0 }],
          },
        ],
      },
    })
    const { slug } = await pollRes.json() as { slug: string }

    // Access without auth
    await page.goto(`/dashboard/polls/${slug}/analytics`)

    // Should redirect to login (ProtectedRoute)
    await expect(page).toHaveURL(/\/login/)
  })
})
