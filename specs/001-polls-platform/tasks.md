# Tasks: Polls Platform

**Input**: Design documents from `specs/001-polls-platform/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Context**: The backend is **complete**. All implementation work is **frontend-only** in `frontend/src/`. Three gaps remain:
1. `PollPage` — public poll-taking page at `/{slug}` (US1)
2. `DashboardPage` — full poll management UI replacing the placeholder (US2)
3. `PollAnalyticsPage` — analytics page at `/dashboard/polls/:slug/analytics` (US3)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared API module and extend types that all user story phases depend on.

- [x] T001 Create `frontend/src/api/polls.ts` — Axios-based API module wrapping all poll, response, and analytics endpoints using the existing `apiClient` from `frontend/src/api/client.ts`
- [x] T002 [P] Extend `frontend/src/types/poll.ts` — add `PollDetail` (extends `PollSummary` with `questions`, `accessToken`, `updatedAt`), `SubmitResponsePayload`, and `AnswerPayload` types per data-model.md contracts
- [x] T003 [P] Verify/extend `frontend/src/types/analytics.ts` — ensure `PollAnalytics`, `ChoiceQuestionAnalytics`, and `TextQuestionAnalytics` types match the `GET /analytics/:slug` response shape from contracts/api.md

**Checkpoint**: Shared API module and types are ready — all user story phases can now begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire the new routes into the router so all pages are reachable. This must be done before any page component can be tested end-to-end.

**⚠️ CRITICAL**: Route registration blocks E2E testing of all user stories

- [x] T004 Update `frontend/src/router.tsx` — add `{ path: '/:slug', element: <PollPage /> }` as a **public** route (outside any `ProtectedRoute`) after all named routes and before the `*` catch-all; add `{ path: '/dashboard/polls/:slug/analytics', element: <PollAnalyticsPage /> }` **inside** the existing `ProtectedRoute` children block (analytics requires auth)

**Checkpoint**: Routes registered — pages are reachable at their URLs

---

## Phase 3: User Story 1 — Respondent Opens a Poll and Completes It (Priority: P1) 🎯 MVP

**Goal**: A visitor navigates to `/{slug}`, sees the poll form, submits answers, sees a thank-you confirmation, and is cookie-deduplicated on return visits.

**Independent Test**: Open a poll URL `/{slug}` in a browser, complete and submit the form, verify the thank-you state appears in-place, reload the URL and verify the "already responded" state is shown without the form.

### Implementation for User Story 1

- [x] T005 [P] [US1] Implement `getPollBySlug(slug, accessToken?)` and `submitResponse(slug, payload)` functions in `frontend/src/api/polls.ts` — consuming `GET /api/v1/polls/:slug` and `POST /api/v1/polls/:slug/responses`; `getPollBySlug` passes `accessToken` as a `?accessToken=` query parameter when provided (FR-013)
- [x] T006 [P] [US1] Create `frontend/src/components/polls/QuestionRenderer.tsx` — renders a single question based on its `type` (`SINGLE_CHOICE` radio group, `MULTIPLE_CHOICE` checkbox group, `TEXT` textarea); accepts `question: Question`, `value`, and `onChange` props
- [x] T007 [US1] Create `frontend/src/pages/PollPage.tsx` — public page at `/:slug` that:
  - On mount: reads `responded_<slug>` cookie via `document.cookie`; if present, renders "already responded" state immediately (no API call for UI state — SC-002)
  - Reads `accessToken` query parameter from the URL via `useSearchParams()` and passes it to `getPollBySlug(slug, accessToken)` to support private poll access (FR-013)
  - Fetches poll via `useQuery(['poll', slug], () => getPollBySlug(slug, accessToken))` using TanStack Query
  - Renders loading skeleton, poll unavailable state (inactive/expired → 410), access denied state (private without token → 403), and the poll form
  - Uses `react-hook-form` + Zod schema for form state; validates all required questions answered (FR-006); Zod schema defined inline in the file
  - On submit: calls `submitResponse`; on `201` sets `responded_<slug>=true; SameSite=Lax; path=/` cookie and replaces form with thank-you confirmation in-place (FR-003); on `409 Conflict` shows duplicate error in-form (not full-page replace); on `410 Gone` from submit shows in-form expiry error (poll expired mid-fill edge case)
  - Sends `respondentFingerprint` from `localStorage` key `respondent_id` (generates UUID if absent) with every submission (Decision 4)
  - Handles `409 Conflict` (auth duplicate — hard server dedup), `429 Too Many Requests` (rate limit), `410 Gone` (expired mid-fill) as in-form error states without replacing the page
- [x] T008 [US1] Add Vitest unit tests in `frontend/src/pages/__tests__/PollPage.test.tsx` — cover: renders questions, shows already-responded state on cookie present, shows poll unavailable on 410, shows access denied on 403, shows thank-you after successful submit, shows duplicate error on 409
- [x] T009 [US1] Create Playwright E2E spec `frontend/e2e/poll-taking.e2e.ts` — scenarios: anonymous submission sets cookie and shows thank-you; returning visitor sees already-responded state; authenticated user submission; rate-limit error display

**Checkpoint**: User Story 1 is fully functional — poll-taking flow works end-to-end independently

---

## Phase 4: User Story 2 — Registered User Creates and Manages a Poll (Priority: P1)

**Goal**: A logged-in user can view their polls list, create a new poll with questions, edit metadata, replace questions, toggle active status, regenerate access token, and delete a poll — all from the `/dashboard` page.

**Independent Test**: Register, log in, create a poll with at least one question of each type, copy the poll URL, verify it is publicly accessible, then edit and delete the poll from the dashboard.

### Implementation for User Story 2

- [x] T010 [P] [US2] Implement poll management API functions in `frontend/src/api/polls.ts`:
  - `getMyPolls(params?)` → `GET /api/v1/polls/my`
  - `createPoll(payload)` → `POST /api/v1/polls`
  - `updatePoll(slug, payload)` → `PATCH /api/v1/polls/:slug`
  - `replaceQuestions(slug, questions)` → `PUT /api/v1/polls/:slug/questions`
  - `deletePoll(slug)` → `DELETE /api/v1/polls/:slug`
  - `regenerateToken(slug)` → `POST /api/v1/polls/:slug/regenerate-token`
- [x] T011 [P] [US2] Create `frontend/src/components/polls/PollFormModal.tsx` — modal dialog for creating/editing a poll; uses `react-hook-form` + Zod schema enforcing: title non-empty, 1–20 questions, each `SINGLE_CHOICE`/`MULTIPLE_CHOICE` question has ≥1 option, `TEXT` questions have no options; supports adding/removing/reordering questions and options inline; accepts `poll?: PollDetail` prop (undefined = create mode, defined = edit mode)
- [x] T012 [P] [US2] Create `frontend/src/components/polls/PollListItem.tsx` — row/card component for a single poll in the dashboard list; displays title, slug, visibility badge, active status toggle, response count, expiry date; action buttons: Edit, View Analytics, Copy Link, Regenerate Token (private only), Delete
- [x] T013 [US2] Replace the placeholder in `frontend/src/pages/DashboardPage.tsx` with the full poll management UI:
  - `useQuery(['my-polls'], getMyPolls)` for the polls list
  - `useMutation` for create, update, delete, replace-questions, regenerate-token — each invalidates `['my-polls']` on success
  - Renders `PollListItem` for each poll; "Create Poll" button opens `PollFormModal` in create mode
  - Edit action opens `PollFormModal` in edit mode pre-populated with existing poll data
  - Delete action shows a confirmation dialog before calling `deletePoll`
  - Empty state when user has no polls
- [x] T014 [US2] Add Vitest unit tests in `frontend/src/pages/__tests__/DashboardPage.test.tsx` — cover: renders polls list, opens create modal, submits create form, opens edit modal pre-populated, confirms and executes delete, shows empty state
- [x] T015 [US2] Create Playwright E2E spec `frontend/e2e/dashboard-polls.e2e.ts` — scenarios: create poll with all question types, edit poll metadata, replace questions (verify warning about answer deletion), delete poll (verify 404 at slug), toggle active status, copy shareable link

**Checkpoint**: User Story 2 is fully functional — poll CRUD works end-to-end independently

---

## Phase 5: User Story 3 — Poll Owner Views Analytics and Exports Results (Priority: P2)

**Goal**: A poll owner opens `/dashboard/polls/:slug/analytics`, sees total responses, a day-by-day timeline chart, per-question breakdowns, and can download a CSV export.

**Independent Test**: Create a poll, submit several responses with different answers, open the analytics page, verify counts and percentages, download the CSV and verify its contents.

### Implementation for User Story 3

- [x] T016 [P] [US3] Implement analytics API functions in `frontend/src/api/polls.ts`:
  - `getPollAnalytics(slug)` → `GET /api/v1/analytics/:slug`
  - `exportPollCsv(slug)` — fetches `GET /api/v1/analytics/:slug/export` using `apiClient` with `responseType: 'blob'`; creates a temporary object URL via `URL.createObjectURL(blob)`, triggers download via a programmatic `<a>` click, then revokes the URL. **Do NOT use `window.open` or embed the auth token in the URL** (constitution Principle V — tokens in URLs are logged by servers/proxies)
- [x] T017 [P] [US3] Create `frontend/src/components/polls/AnalyticsChart.tsx` — Recharts `LineChart` rendering `responsesOverTime` data (x-axis: date, y-axis: count); responsive container; accessible labels
- [x] T018 [P] [US3] Create `frontend/src/components/polls/QuestionAnalyticsCard.tsx` — renders per-question analytics: for `SINGLE_CHOICE`/`MULTIPLE_CHOICE` shows option bars with count and percentage; for `TEXT` shows a scrollable list of verbatim text answers
- [x] T019 [US3] Create `frontend/src/pages/PollAnalyticsPage.tsx` — protected page at `/dashboard/polls/:slug/analytics`:
  - `useQuery(['analytics', slug], () => getPollAnalytics(slug), { staleTime: 30_000 })` for data (30s stale time for perceived performance — SC-004)
  - Renders total response count, `AnalyticsChart` for timeline, `QuestionAnalyticsCard` for each question
  - "Export CSV" button calls `exportPollCsv(slug)` and triggers download; show a loading/disabled state on the button while the fetch is in progress (SC-006 UX)
  - Loading skeleton and error states (403 if not owner, 404 if poll not found)
- [x] T020 [US3] Add link from `PollListItem` in `frontend/src/components/polls/PollListItem.tsx` to the analytics page at `/dashboard/polls/:slug/analytics` (View Analytics button)
- [x] T021 [US3] Add Vitest unit tests in `frontend/src/pages/__tests__/PollAnalyticsPage.test.tsx` — cover: renders total count, renders chart with timeline data, renders choice question breakdown with percentages, renders text question answers list, CSV export button triggers download
- [x] T022 [US3] Create Playwright E2E spec `frontend/e2e/analytics.e2e.ts` — scenarios: navigate to analytics page, verify response count matches submitted responses, verify CSV download initiates

**Checkpoint**: User Story 3 is fully functional — analytics and export work end-to-end independently

---

## Phase 6: User Story 4 — User Registers and Authenticates (Priority: P2)

**Goal**: Registration, login, silent session restore on reload, and logout all work correctly via the existing auth pages and Zustand store.

**Independent Test**: Register a new account, log out, log back in, reload the page (verify silent session restore), log out again.

**Status note**: The auth pages (`LoginPage`, `RegisterPage`) and `authStore` already exist. This phase verifies they are complete and wires any missing pieces.

### Implementation for User Story 4

- [x] T023 [P] [US4] Audit `frontend/src/pages/LoginPage.tsx` — verify it uses `react-hook-form` + Zod (min 8 chars password), calls `POST /auth/login`, stores `accessToken` in `authStore`, redirects to `/dashboard` on success, and shows error message on `401`
- [x] T024 [P] [US4] Audit `frontend/src/pages/RegisterPage.tsx` — verify it uses `react-hook-form` + Zod (name non-empty, valid email, password ≥8 chars), calls `POST /auth/register`, auto-logs in on `201`, redirects to `/dashboard`, shows `409` conflict error
- [x] T025 [US4] Audit `frontend/src/store/authStore.ts` — verify silent session restore on app init calls `POST /auth/refresh` using the `refresh_token` cookie, updates `accessToken` in store, and handles `401` gracefully (clears auth state); verify logout calls `POST /auth/logout` and clears store; verify that `frontend/src/App.tsx` (or `frontend/src/main.tsx`) calls the refresh action on mount so session restore fires on every page load (FR-019)
- [x] T026 [US4] Add Vitest unit tests in `frontend/src/pages/__tests__/LoginPage.test.tsx` — cover: renders form, shows error on 401, redirects on success (constitution Principle II — non-trivial component with auth state)
- [x] T027 [US4] Add Vitest unit tests in `frontend/src/pages/__tests__/RegisterPage.test.tsx` — cover: renders form, validates password length, shows 409 conflict error, redirects on success (constitution Principle II)
- [x] T028a [US4] Create Playwright E2E spec `frontend/e2e/auth.e2e.ts` — scenarios: register new account → auto-redirect to dashboard; logout → redirect to landing; login with correct credentials → dashboard; reload page → silent session restore (no re-login prompt); login with wrong credentials → error message (constitution Principle II — auth is a critical user journey)

**Checkpoint**: User Story 4 is fully functional — auth flow works end-to-end independently

---

## Phase 7: User Story 5 — Admin Manages Users and Polls (Priority: P3)

**Goal**: Admin panel at `/admin` shows stats; `/admin/users` supports filtering, role changes, bulk ops; `/admin/polls` supports filtering and deletion.

**Independent Test**: Promote a user to ADMIN, log in as that admin, navigate to `/admin/users`, change another user's role, verify the change persists.

**Status note**: Admin pages (`AdminDashboardPage`, `AdminUsersPage`, `AdminPollsPage`) and the `admin.ts` API module already exist. This phase verifies completeness and fills any gaps.

### Implementation for User Story 5

- [x] T029 [P] [US5] Audit `frontend/src/api/admin.ts` — verify all required admin API calls are implemented: `getStats`, `getUsers(params)`, `updateUserRole(id, role)`, `bulkUpdateUsers(ids, action, role?)`, `getPolls(params)`, `deletePoll(id)`; add any missing functions
- [x] T030 [P] [US5] Audit `frontend/src/pages/admin/AdminDashboardPage.tsx` — verify it fetches `GET /admin/stats` and displays `totalUsers`, `totalPolls`, `activePolls` in stat cards
- [x] T031 [P] [US5] Audit `frontend/src/pages/admin/AdminUsersPage.tsx` — verify: paginated user list, search/role filter, individual role change dropdown, bulk select checkboxes, bulk role change and bulk delete actions, CSV export button
- [x] T032 [US5] Audit `frontend/src/pages/admin/AdminPollsPage.tsx` — verify: paginated poll list, filter by visibility and isActive, delete any poll action; add any missing filter or action
- [x] T033 [US5] Verify `frontend/src/components/AdminRoute.tsx` — confirm it redirects non-admin authenticated users and unauthenticated users away from `/admin/*` routes (FR-026, SC-009)
- [x] T034 [US5] Verify/extend `frontend/e2e/admin/` Playwright specs — confirm existing specs in `frontend/e2e/admin/` cover the US5 acceptance scenarios: admin stats dashboard, user role change, bulk delete, poll list with filters, non-admin redirect (constitution Principle II — admin flows require Playwright coverage)

**Checkpoint**: User Story 5 is fully functional — admin panel works end-to-end independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all user stories before merge.

- [x] T035 [P] Run `npm run check:ts` from repo root — fix any TypeScript errors introduced by new files; ensure no `any` without inline justification
- [x] T036 [P] Run `npm run lint` from repo root — fix any ESLint warnings or errors in new frontend files
- [x] T037 [P] Verify mobile responsiveness of `PollPage`, `DashboardPage` (with `PollFormModal`), and `PollAnalyticsPage` — use Tailwind responsive classes; test at 375px and 768px viewport widths
- [x] T038 [P] Add `frontend/src/api/__tests__/polls.test.ts` — unit tests for all functions in `frontend/src/api/polls.ts` (mock `apiClient`; verify correct HTTP method, URL, and payload for each function)
- [x] T039 Validate the full quickstart.md workflow: `docker compose up --build`, seed data, open `/{slug}` in browser, submit response, open `/dashboard`, create a poll, view analytics — confirm all flows work in the Docker environment
- [x] T040 [P] Update `frontend/README.md` — document the three new pages (`PollPage`, `DashboardPage` poll management, `PollAnalyticsPage`) and the cookie deduplication mechanism

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 and T003 can run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 (needs `PollPage` and `PollAnalyticsPage` imports) — BLOCKS E2E testing
- **User Story 1 (Phase 3)**: Depends on Phase 1 (T001, T002) and Phase 2 (T004)
- **User Story 2 (Phase 4)**: Depends on Phase 1 (T001, T002) and Phase 2 (T004); independent of US1
- **User Story 3 (Phase 5)**: Depends on Phase 1 (T001, T003) and Phase 2 (T004); independent of US1/US2
- **User Story 4 (Phase 6)**: Depends on Phase 1 only (auth API already exists); independent of US1/US2/US3
- **User Story 5 (Phase 7)**: Depends on Phase 1 only (admin API already exists); independent of all other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1 — no dependencies on other stories
- **US2 (P1)**: Can start after Phase 1 — no dependencies on other stories; shares `polls.ts` API module with US1 (add functions sequentially or in separate branches)
- **US3 (P2)**: Can start after Phase 1 — depends on US2's `PollListItem` for the analytics link (T020), but the page itself (T019) is independent
- **US4 (P2)**: Can start after Phase 1 — fully independent (auth pages already exist)
- **US5 (P3)**: Can start after Phase 1 — fully independent (admin pages already exist)

### Within Each User Story

- API functions before page components (page depends on API)
- Sub-components (`QuestionRenderer`, `PollFormModal`, etc.) before the page that uses them
- Page implementation before unit tests
- Unit tests before E2E tests

### Parallel Opportunities

- T002 and T003 (type extensions) can run in parallel during Phase 1
- T005 and T006 (US1 API + QuestionRenderer) can run in parallel
- T010 and T011 and T012 (US2 API + PollFormModal + PollListItem) can run in parallel
- T016, T017, T018 (US3 API + AnalyticsChart + QuestionAnalyticsCard) can run in parallel
- T023, T024 (US4 page audits) can run in parallel
- T029, T030, T031 (US5 audits) can run in parallel
- T035, T036, T037, T038, T040 (Polish tasks) can all run in parallel

---

## Parallel Example: User Story 1

```bash
# These can run simultaneously (different files, no dependencies):
T005: Implement getPollBySlug + submitResponse in frontend/src/api/polls.ts
T006: Create QuestionRenderer component in frontend/src/components/polls/QuestionRenderer.tsx

# Then sequentially (page depends on both):
T007: Create PollPage.tsx (depends on T005, T006)
T008: Write PollPage unit tests (depends on T007)
T009: Write poll-taking E2E spec (depends on T007 + running stack)
```

## Parallel Example: User Story 2

```bash
# These can run simultaneously:
T010: Implement poll management API functions in frontend/src/api/polls.ts
T011: Create PollFormModal component in frontend/src/components/polls/PollFormModal.tsx
T012: Create PollListItem component in frontend/src/components/polls/PollListItem.tsx

# Then sequentially:
T013: Replace DashboardPage placeholder (depends on T010, T011, T012)
T014: Write DashboardPage unit tests (depends on T013)
T015: Write dashboard-polls E2E spec (depends on T013 + running stack)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004) — register routes
3. Complete Phase 3: User Story 1 (T005–T009 — 5 tasks)
4. **STOP and VALIDATE**: Open `/{slug}` in browser, submit a response, verify cookie deduplication
5. Deploy/demo if ready — the core poll-taking flow is live

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Poll-taking works → **Demo MVP**
3. Phase 4 (US2) → Dashboard poll management works → **Demo v2**
4. Phase 5 (US3) → Analytics and CSV export work → **Demo v3**
5. Phase 6 (US4) → Auth flow verified complete → **Demo v4**
6. Phase 7 (US5) → Admin panel verified complete → **Demo v5**
7. Phase 8 → Polish, TypeScript check, lint, Docker validation → **Ready for merge**

### Parallel Team Strategy

With multiple developers (after Phase 1 + Phase 2 complete):
- **Developer A**: User Story 1 (PollPage — most critical)
- **Developer B**: User Story 2 (DashboardPage poll management)
- **Developer C**: User Story 3 (PollAnalyticsPage) + User Story 4 audit

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies — safe to run in parallel
- `[Story]` label maps each task to a specific user story for traceability
- The backend is **complete** — no backend tasks are included
- `frontend/src/api/polls.ts` is the only shared file across stories; add functions incrementally to avoid conflicts
- Cookie deduplication uses native `document.cookie` — no new dependency needed (Decision 3)
- Respondent fingerprint uses `localStorage` key `respondent_id` with a generated UUID (Decision 4)
- Recharts is already installed — no new chart library needed (Decision 6)
- `npm run check:ts` must pass before merge (constitution Principle I)
- No `it.skip` left in `main` (constitution Principle II)
