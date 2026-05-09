# Research: Polls Platform

**Branch**: `001-polls-platform` | **Phase**: 0 | **Date**: 2026-05-08

## Summary

All technical unknowns have been resolved by inspecting the existing codebase. The backend is
**complete** — every API endpoint required by the spec is already implemented. The primary
implementation gap is the **frontend**: the public poll-taking page (`/{slug}`) does not exist,
and the `/dashboard` poll management UI is a placeholder. This research document records the
decisions already embedded in the codebase and the patterns to follow for the missing frontend
work.

---

## Decision 1: Backend API — Already Implemented

**Decision**: The NestJS backend under `backend/src/` is feature-complete for this spec.

**Evidence**:
- `PollsService.findBySlug()` — fetches poll with questions + options, enforces visibility/expiry.
- `ResponsesService.submit()` — validates required questions, deduplicates (auth + fingerprint), creates answers in a transaction.
- `AnalyticsService.getAnalytics()` / `exportCsv()` — full analytics + CSV streaming.
- `AuthService` — JWT access + refresh token rotation, bcrypt hashing.
- Admin endpoints — user/poll CRUD with role guard.
- Rate limiting — `@nestjs/throttler` wired in `AppModule`.

**Rationale**: No backend changes are needed. All implementation effort is frontend-only.

**Alternatives considered**: N/A — backend is already shipped.

---

## Decision 2: Public Poll Page Route (`/{slug}`)

**Decision**: Add a new catch-all public route `/:slug` in React Router **before** the `*` 404
route. The page is a new `PollPage` component at `frontend/src/pages/PollPage.tsx`.

**Rationale**:
- The router already uses `createBrowserRouter` with explicit paths. Adding `/:slug` as a public
  route (no `ProtectedRoute` wrapper) is the minimal change.
- The route must be ordered **after** all named routes (`/`, `/login`, `/register`, `/dashboard`,
  `/admin/*`) so it does not shadow them.
- The backend `GET /api/v1/polls/:slug` endpoint already returns the full poll with questions and
  options — no new API call shape is needed.

**Alternatives considered**:
- `/polls/:slug` — rejected because the spec explicitly requires `/{slug}` as the public URL.
- Nested under `/dashboard` — rejected; poll-taking is public and must not require auth.

---

## Decision 3: Cookie-Based Deduplication (Frontend)

**Decision**: After a successful submission, the frontend sets a cookie named
`responded_<slug>=true` with `SameSite=Lax; path=/`. On page load, the frontend reads this
cookie before making any API call. If the cookie is present, the "already responded" state is
shown immediately (no server round-trip for the UI state — satisfies SC-002).

**Rationale**:
- The spec (FR-003, FR-004) explicitly requires cookie-based deduplication scoped per poll.
- The backend also stores `respondentFingerprint` for soft server-side deduplication, but the
  frontend cookie is the primary UX mechanism.
- Using `js-cookie` or the native `document.cookie` API — the project has no existing cookie
  library, so native `document.cookie` is used to avoid adding a dependency.

**Alternatives considered**:
- `localStorage` — rejected; cookies are explicitly required by the spec.
- `sessionStorage` — rejected; does not persist across browser sessions.

---

## Decision 4: Respondent Fingerprint

**Decision**: The frontend generates a lightweight fingerprint (UUID stored in `localStorage`
under key `respondent_id`) and sends it as `respondentFingerprint` in the submission payload.
This is the same field the backend already reads from `SubmitResponseDto`.

**Rationale**:
- The backend `ResponsesService.submit()` already accepts `dto.respondentFingerprint` as a
  fallback when no `userId` is present.
- A stable UUID in `localStorage` survives page reloads but not cookie clears — consistent with
  the spec's accepted trade-off for anonymous users.

**Alternatives considered**:
- Browser fingerprinting libraries (FingerprintJS) — rejected; overkill for a soft deduplication
  mechanism that the spec explicitly accepts as bypassable.

---

## Decision 5: Dashboard Poll Management UI

**Decision**: Replace the `DashboardPage` placeholder with a full poll management UI. The page
will use TanStack Query for data fetching and react-hook-form + Zod for the create/edit form.
A modal or slide-over panel will host the poll creation/editing form.

**Rationale**:
- The constitution mandates TanStack Query 5, react-hook-form, and Zod for frontend data and
  forms — these are already installed.
- The backend endpoints for owner poll management already exist:
  - `GET /api/v1/polls/my` — list owner's polls
  - `POST /api/v1/polls` — create poll
  - `PATCH /api/v1/polls/:slug` — update metadata
  - `PUT /api/v1/polls/:slug/questions` — replace questions
  - `DELETE /api/v1/polls/:slug` — delete poll
  - `POST /api/v1/polls/:slug/regenerate-token` — regenerate access token

**Alternatives considered**:
- Separate `/dashboard/polls/new` route — rejected; a modal keeps the UX simpler and avoids
  additional routing complexity for a single-page management view.

---

## Decision 6: Analytics Frontend Page

**Decision**: Add a `/dashboard/polls/:slug/analytics` route with a `PollAnalyticsPage`
component. It uses Recharts (already installed) for the responses-over-time line chart and
renders per-question breakdowns inline. The CSV export button calls
`GET /api/v1/analytics/:slug/export` and triggers a browser download.

**Rationale**:
- Recharts is already in the constitution's approved stack.
- The analytics API endpoint already returns the exact shape needed (`totalResponses`,
  `responsesOverTime`, `questions` with option counts/percentages and text answers).

**Alternatives considered**:
- Embedding analytics in the dashboard list — rejected; analytics is a separate concern and
  deserves its own page for readability.

---

## Decision 7: Rate Limiting — Already Implemented

**Decision**: `@nestjs/throttler` is already configured in `AppModule`. The response submission
endpoint is covered. No additional backend work needed.

**Rationale**: The spec requires HTTP 429 on rate limit breach (FR-028, SC-010). The existing
throttler configuration satisfies this.

**Alternatives considered**: N/A.

---

## Decision 8: Frontend API Module for Polls

**Decision**: Add a `frontend/src/api/polls.ts` module (alongside the existing `auth.ts` and
`admin.ts`) that wraps all poll-related API calls using `apiClient` (the existing Axios instance
with JWT interceptors).

**Rationale**: Consistent with the existing API layer pattern. The `apiClient` already handles
token refresh transparently.

**Alternatives considered**: Inline `fetch` calls — rejected; inconsistent with the project
pattern and would bypass the token refresh interceptor.

---

## Decision 9: Zod Schemas for Frontend Validation

**Decision**: Define Zod schemas for the poll creation/edit form and the response submission
form. These schemas mirror the backend DTOs but are frontend-owned.

**Rationale**: Constitution Principle I mandates Zod for incoming form/API data on the frontend.

**Alternatives considered**: Manual validation — rejected by constitution.

---

## Decision 10: Test Coverage Plan

**Decision**:
- **Unit (Vitest)**: `PollPage` component (renders questions, shows already-responded state,
  shows unavailable state), `DashboardPage` poll management (create/edit/delete modals),
  `PollAnalyticsPage` (renders chart and question breakdowns), `polls.ts` API module.
- **E2E (Playwright)**: Poll submission flow (anonymous + authenticated), dashboard poll CRUD,
  analytics page.
- **Backend**: No new backend tests needed (backend is complete and already tested).

**Rationale**: Constitution Principle II requires Vitest for non-trivial components and
Playwright for critical user journeys. Poll submission and dashboard management are both
critical journeys.

**Alternatives considered**: N/A — constitution mandates this coverage.

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Does the backend need changes? | No — all API endpoints are implemented and tested. |
| How is the `/{slug}` route added without shadowing named routes? | Add `/:slug` after all named routes in `router.tsx`, before the `*` catch-all. |
| How is cookie deduplication implemented? | Native `document.cookie` API, cookie name `responded_<slug>`. |
| How is the respondent fingerprint generated? | UUID stored in `localStorage` under `respondent_id`. |
| What API shape does the poll-taking page consume? | `GET /api/v1/polls/:slug` (existing endpoint). |
| What API shape does response submission use? | `POST /api/v1/polls/:slug/responses` (existing endpoint). |
| What chart library is used for analytics? | Recharts (already installed per constitution). |
| Is there a frontend API module for polls? | To be created: `frontend/src/api/polls.ts`. |
