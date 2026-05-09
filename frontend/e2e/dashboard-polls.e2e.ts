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

test.describe('Dashboard Poll Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, USER_CREDENTIALS)
    await page.goto('/dashboard')
  })

  test('create poll with all question types', async ({ page }) => {
    await page.getByRole('button', { name: /create poll/i }).click()

    // Fill title
    await page.getByPlaceholder('My poll').fill('My E2E Poll')

    // Fill first question (single choice)
    await page.getByPlaceholder('Question text').first().fill('Favourite colour?')
    await page.getByPlaceholder('Option 1').first().fill('Red')
    await page.getByRole('button', { name: /\+ add option/i }).first().click()
    await page.getByPlaceholder('Option 2').first().fill('Blue')

    // Add a text question
    await page.getByRole('button', { name: /\+ add question/i }).click()
    const questionInputs = page.getByPlaceholder('Question text')
    await questionInputs.last().fill('Any comments?')
    const typeSelects = page.locator('select').filter({ hasText: 'Single choice' })
    await typeSelects.last().selectOption('TEXT')

    // Submit
    await page.getByRole('button', { name: /create poll$/i }).click()

    // Poll should appear in list
    await expect(page.getByText('My E2E Poll')).toBeVisible()
  })

  test('edit poll metadata', async ({ page }) => {
    // Create a poll first via API
    const token = await getAccessToken(page)
    await page.request.post(`${API_BASE}/polls`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Poll to Edit',
        visibility: 'PUBLIC',
        questions: [
          {
            text: 'Q1?',
            type: 'SINGLE_CHOICE',
            orderIndex: 0,
            isRequired: true,
            options: [{ text: 'A', orderIndex: 0 }],
          },
        ],
      },
    })

    await page.reload()
    await expect(page.getByText('Poll to Edit')).toBeVisible()

    await page.getByRole('button', { name: /edit/i }).first().click()

    // Edit title — use value selector since Playwright Page has no getByDisplayValue
    const titleInput = page.locator('input[value="Poll to Edit"]')
    await titleInput.clear()
    await titleInput.fill('Poll Edited')

    await page.getByRole('button', { name: /save changes/i }).click()

    await expect(page.getByText('Poll Edited')).toBeVisible()
  })

  test('delete poll — verify 404 at slug', async ({ page }) => {
    const token = await getAccessToken(page)
    const res = await page.request.post(`${API_BASE}/polls`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Poll to Delete',
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
    const { slug } = await res.json() as { slug: string }

    await page.reload()
    await expect(page.getByText('Poll to Delete')).toBeVisible()

    await page.getByRole('button', { name: /delete/i }).first().click()
    await page.getByRole('button', { name: /^delete$/i }).click()

    await expect(page.getByText('Poll to Delete')).not.toBeVisible()

    // Verify poll is gone at its URL
    await page.goto(`/${slug}`)
    await expect(page.getByText(/poll not found|unavailable/i)).toBeVisible()
  })

  test('toggle active status', async ({ page }) => {
    const token = await getAccessToken(page)
    await page.request.post(`${API_BASE}/polls`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Toggle Poll',
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

    await page.reload()
    await expect(page.getByText('Toggle Poll')).toBeVisible()

    // Deactivate
    await page.getByRole('button', { name: /deactivate/i }).first().click()
    await expect(page.getByText('Inactive').first()).toBeVisible()

    // Reactivate
    await page.getByRole('button', { name: /activate/i }).first().click()
    await expect(page.getByText('Active').first()).toBeVisible()
  })

  test('copy shareable link', async ({ page }) => {
    const token = await getAccessToken(page)
    await page.request.post(`${API_BASE}/polls`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Copy Link Poll',
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

    await page.reload()
    await expect(page.getByText('Copy Link Poll')).toBeVisible()

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('button', { name: /copy link/i }).first().click()

    // Verify clipboard contains a URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toMatch(/^https?:\/\//)
  })
})
