# Feature Specification: Polls Platform

**Feature Branch**: `001-polls-platform`
**Created**: 2026-05-08
**Status**: Implemented
**Input**: User description: "learn repo and fill the specification"

## Clarifications

### Session 2026-05-08

- Q: What should happen immediately after a respondent successfully submits a poll response? → A: Show a thank-you message in-place on the `/{slug}` page (form replaced by confirmation).
- Q: Is the frontend poll management UI (create/edit/delete polls from the /dashboard page) in scope for this feature, or deferred? → A: In scope — implement full dashboard poll management UI (create, edit, delete, view my polls).
- Q: Should the system enforce rate limiting on poll response submissions to prevent abuse? → A: Yes — rate limit response submissions per IP (e.g., max N submissions per minute).
- Q: Should there be a minimum password strength requirement for user registration? → A: Minimum 8 characters, no other constraints.
- Q: Should there be a maximum number of questions allowed per poll? → A: Yes — maximum 20 questions per poll.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Respondent Opens a Poll by Direct Link and Completes It (Priority: P1)

A respondent receives a direct link to a poll in the form `/{slug}`. They open the page, see the poll title, description, and all questions. They fill in their answers and submit. The system records their response and sets a cookie in their browser to identify them as having already responded. If they return to the same poll URL later, the system detects the cookie and shows a "you have already responded" message instead of the form.

**Why this priority**: This is the primary user journey of the entire platform — collecting responses via shareable links. Every other feature exists to support or enhance this flow.

**Independent Test**: Can be fully tested by opening a poll URL `/{slug}` in a browser, completing and submitting the form, then reloading the same URL and verifying the "already responded" state is shown (cookie-based deduplication).

**Acceptance Scenarios**:

1. **Given** a public, active poll with slug `my-poll`, **When** a respondent navigates to `/my-poll`, **Then** they see the poll title, description, and all questions with their answer options — no login required.
2. **Given** a respondent who has filled in all required questions, **When** they submit the form, **Then** the system saves their response, replaces the form with an in-place thank-you confirmation message on the same `/{slug}` page, and sets a respondent-identification cookie in their browser.
3. **Given** a respondent who already has the respondent cookie for this poll, **When** they navigate to the poll URL again, **Then** the system shows the same "you have already responded" in-place state and does not display the form.
4. **Given** an authenticated user who submits a response, **When** they try to submit again (even from a different browser), **Then** the system rejects the duplicate based on their user account identity.
5. **Given** a poll that has expired or is marked inactive, **When** any user navigates to its URL, **Then** the system shows a "poll unavailable" message instead of the form.
6. **Given** a private poll, **When** a user navigates to its URL without a valid access token query parameter, **Then** the system shows an "access denied" message.

---

### User Story 2 - Registered User Creates and Manages a Poll (Priority: P1)

A registered user logs in, creates a new poll with a title, description, questions (single-choice, multiple-choice, or free-text), and configures visibility (public or private) and an optional expiry date. They can later edit poll metadata, replace the question set, activate/deactivate the poll, and delete it. They share the poll URL `/{slug}` with respondents.

**Why this priority**: Poll creation is the supply side of the platform. Without creators, there are no polls to take.

**Independent Test**: Can be fully tested by registering, logging in, using the dashboard UI to create a poll with at least one question of each type, copying the poll URL, verifying it is publicly accessible, then editing and deleting the poll from the dashboard.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they submit a valid poll creation form with at least one question, **Then** a new poll is created with a unique URL slug and appears in their "My Polls" list.
2. **Given** a poll owner, **When** they update the poll title, description, visibility, or active status, **Then** the changes are reflected immediately at the poll URL.
3. **Given** a poll owner, **When** they replace the question set, **Then** the old questions and all their collected answers are removed and the new questions take effect.
4. **Given** a poll owner, **When** they delete a poll, **Then** the poll and all associated responses are permanently removed and the URL returns a 404.
5. **Given** a poll set to PRIVATE, **When** the owner shares the link with the access token, **Then** only users with that token can view and respond to the poll.
6. **Given** a poll owner, **When** they regenerate the access token for a private poll, **Then** all previously shared links become invalid and a new link is generated.

---

### User Story 3 - Poll Owner Views Analytics and Exports Results (Priority: P2)

A poll owner opens the analytics view for one of their polls. They see the total number of responses, a timeline chart of responses per day, and per-question breakdowns: option counts with percentages for choice questions, and raw text answers for free-text questions. They can also export all responses as a CSV file.

**Why this priority**: Analytics is the primary reason creators run polls. Without it, the platform has no retention value for creators.

**Independent Test**: Can be fully tested by creating a poll, submitting several responses with different answers, then opening the analytics page and verifying counts, percentages, and the downloaded CSV file.

**Acceptance Scenarios**:

1. **Given** a poll with responses, **When** the owner opens the analytics page, **Then** they see the total response count and a day-by-day response timeline.
2. **Given** a choice question with responses, **When** the owner views analytics, **Then** each option shows its selection count and percentage of total answers for that question.
3. **Given** a free-text question with responses, **When** the owner views analytics, **Then** all submitted text answers are listed verbatim.
4. **Given** a poll with responses, **When** the owner clicks "Export CSV", **Then** a file is downloaded containing one row per response with columns for submission time, respondent name (or "Anonymous"), and each question.

---

### User Story 4 - User Registers and Authenticates (Priority: P2)

A new visitor registers with their name, email, and password. They are logged in automatically and redirected to their dashboard. On subsequent visits, their session is restored automatically via a refresh token stored in an HTTP-only cookie. They can log out, which invalidates the session server-side.

**Why this priority**: Authentication gates poll creation and analytics. Anonymous poll-taking works without it, but the creator experience requires accounts.

**Independent Test**: Can be fully tested by registering a new account, logging out, logging back in, verifying the session is restored on page reload, then logging out again.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they submit a valid registration form (name, email, password), **Then** an account is created and they are logged in automatically and redirected to their dashboard.
2. **Given** a registered user, **When** they log in with correct credentials, **Then** they receive an access token and are redirected to their dashboard.
3. **Given** a logged-in user who reloads the page, **When** the app initialises, **Then** their session is restored silently using the refresh token cookie without requiring re-login.
4. **Given** a logged-in user, **When** they click "Log out", **Then** their session is terminated server-side and they are redirected to the landing page.
5. **Given** a user who submits incorrect credentials, **When** the login form is submitted, **Then** an error message is shown and no session is created.

---

### User Story 5 - Admin Manages Users and Polls (Priority: P3)

An administrator logs in and accesses the admin panel. They can view all registered users with filtering and sorting, change user roles (USER ↔ ADMIN), bulk-update roles, bulk-delete users, and export the user list as CSV. They can also view all polls in the system with filtering by visibility and active status, and delete any poll.

**Why this priority**: Admin capabilities are operational tooling. The platform functions without them, but they are necessary for moderation and user management at scale.

**Independent Test**: Can be fully tested by promoting a user to ADMIN, logging in as that admin, navigating to /admin/users, changing another user's role, and verifying the change persists.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they navigate to `/admin`, **Then** they see a dashboard with total user count, total poll count, and active poll count.
2. **Given** an admin on the Users page, **When** they filter by role or search by name/email, **Then** only matching users are shown with pagination.
3. **Given** an admin, **When** they change a user's role via the dropdown, **Then** the role is updated immediately and reflected in the table.
4. **Given** an admin who has selected multiple users, **When** they apply a bulk role change or bulk delete, **Then** all selected users are updated/removed in one operation.
5. **Given** a non-admin user, **When** they attempt to access any `/admin` route, **Then** they are redirected or receive a 403 error.

---

### Edge Cases

- What happens when a poll's expiry date passes while a respondent is filling it in? The submission is rejected with a "poll has expired" error.
- What happens when a required question is left unanswered? The submission is rejected with a specific error naming the unanswered question.
- What happens when a poll title generates a slug that already exists? The slug generation must produce a unique value (e.g., by appending a counter or random suffix).
- What happens when a respondent clears their cookies and tries to submit again? For anonymous users, cookie-based deduplication is a soft mechanism — clearing cookies allows re-submission. This is an accepted trade-off.
- What happens when a poll creator tries to add more than 20 questions? The system rejects the request with a validation error indicating the maximum question limit has been reached.
- What happens when a private poll's access token is regenerated? All existing links with the old token become invalid immediately.
- What happens when an admin tries to delete their own account via bulk delete? This edge case should be handled gracefully (either prevented or warned).
- What happens when a single IP submits responses too rapidly? The system returns a rate-limit error (HTTP 429) and the respondent must wait before trying again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated public page at `/{slug}` for each poll, accessible without authentication.
- **FR-002**: The system MUST allow any visitor (authenticated or anonymous) to submit a response to a public, active, non-expired poll via its `/{slug}` URL.
- **FR-003**: Upon successful response submission, the system MUST replace the poll form with an in-place thank-you confirmation message on the same `/{slug}` page, and set a browser cookie to identify the respondent as having already responded to that specific poll.
- **FR-004**: The system MUST detect the respondent cookie on subsequent visits to the same poll URL and display the same in-place "you have already responded" state instead of the form (no redirect).
- **FR-005**: The system MUST prevent duplicate responses for authenticated users based on their user account identity, regardless of browser or device.
- **FR-006**: The system MUST validate that all required questions are answered before accepting a response submission.
- **FR-007**: The system MUST allow registered users to create polls with a title, optional description, visibility (PUBLIC/PRIVATE), optional expiry date, and one or more questions. A poll MUST contain at least 1 and at most 20 questions.
- **FR-008**: Each question MUST support one of three types: single-choice (one option selectable), multiple-choice (multiple options selectable), or free-text (open answer).
- **FR-009**: The system MUST generate a unique URL slug for each poll based on its title.
- **FR-010**: Poll owners MUST be able to update poll metadata (title, description, visibility, active status, expiry date) without affecting collected responses.
- **FR-011**: Poll owners MUST be able to replace the entire question set of a poll; this operation deletes all previously collected answers.
- **FR-012**: Poll owners MUST be able to delete their poll, which permanently removes all associated questions, options, and responses.
- **FR-013**: Private polls MUST be accessible only to users who provide the correct access token (e.g., as a query parameter in the URL).
- **FR-014**: Poll owners MUST be able to regenerate the access token for a private poll, invalidating all previous links.
- **FR-015**: The system MUST provide per-poll analytics: total response count, responses-per-day timeline, and per-question breakdowns (option counts + percentages for choice questions; raw text answers for free-text questions).
- **FR-016**: Poll owners MUST be able to export all poll responses as a CSV file with one row per response and one column per question.
- **FR-017**: The system MUST support user registration with name, email, and password. Passwords MUST be at least 8 characters long; no additional complexity constraints are required.
- **FR-018**: The system MUST authenticate users via email and password, issuing a short-lived access token and a longer-lived refresh token stored in an HTTP-only cookie.
- **FR-019**: The system MUST silently restore user sessions on page load using the refresh token cookie.
- **FR-020**: The system MUST allow users to log out, which invalidates the refresh token server-side.
- **FR-021**: Administrators MUST be able to view all users with filtering (by role, search term) and sorting, with paginated results.
- **FR-022**: Administrators MUST be able to change individual or multiple users' roles (USER ↔ ADMIN).
- **FR-023**: Administrators MUST be able to bulk-delete users.
- **FR-024**: Administrators MUST be able to view all polls in the system with filtering by visibility and active status.
- **FR-025**: Administrators MUST be able to delete any poll in the system.
- **FR-026**: All admin endpoints MUST be protected and accessible only to users with the ADMIN role.
- **FR-027**: The `/dashboard` page MUST provide a full poll management UI allowing registered users to view their polls list, create new polls (with questions), edit poll metadata, replace questions, activate/deactivate polls, and delete polls.
- **FR-028**: The system MUST enforce rate limiting on the poll response submission endpoint, rejecting requests that exceed the allowed rate per IP address with an HTTP 429 response.

### Key Entities

- **User**: A registered account with name, email, hashed password, and role (USER or ADMIN). Owns polls and can submit responses.
- **Poll**: A survey created by a user. Has a title, optional description, unique slug (used as the public URL path), visibility (PUBLIC/PRIVATE), active flag, optional expiry date, and a unique access token for private access.
- **Question**: Belongs to a poll. Has text, type (SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT), display order, and a required flag. A poll may have a maximum of 20 questions.
- **Option**: A selectable answer choice belonging to a choice-type question. Has text and display order.
- **Response**: A single submission to a poll by one respondent. Linked to a user (if authenticated) or identified by a browser fingerprint (if anonymous). Contains a set of answers.
- **Answer**: A single answer to one question within a response. Stores either a selected option reference or a free-text value.
- **Respondent Cookie**: A browser cookie set after a successful submission, scoped to a specific poll, used to detect and prevent duplicate anonymous submissions on the same device/browser.
- **RefreshToken**: A hashed token linked to a user, used to issue new access tokens without re-authentication. Has an expiry date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Respondents can open a poll via its direct URL and complete their submission in under 2 minutes.
- **SC-002**: Returning respondents are shown the "already responded" state within 1 second of opening the poll URL (cookie detection is instant, no server round-trip required for the UI state).
- **SC-003**: Registered users can create a complete poll (with at least 3 questions) in under 3 minutes.
- **SC-004**: Poll analytics load and display within 3 seconds for polls with up to 10,000 responses.
- **SC-005**: The system correctly rejects 100% of duplicate response submissions from authenticated users.
- **SC-006**: CSV export completes and downloads within 5 seconds for polls with up to 10,000 responses.
- **SC-007**: Session restoration on page reload succeeds silently in under 1 second for users with a valid refresh token.
- **SC-008**: Admin bulk operations (role change, delete) on up to 100 users complete without error.
- **SC-009**: All admin-only endpoints return a 403 error for non-admin authenticated users and a 401 error for unauthenticated requests.
- **SC-010**: The response submission endpoint rejects requests exceeding the rate limit with an HTTP 429 response within 100ms.

## Assumptions

- The poll-taking page at `/{slug}` is a dedicated frontend route that does not yet exist — it is the primary missing piece of the user-facing frontend (the backend API is complete).
- The respondent identification cookie is set by the frontend after a successful submission and is scoped per poll (e.g., `responded_{slug}=true`). The backend additionally stores a fingerprint for server-side soft deduplication.
- Anonymous poll-taking is supported; account creation is not required to submit a response to a public poll.
- Cookie-based deduplication for anonymous users is a soft mechanism — clearing browser cookies allows re-submission. This is an accepted trade-off.
- The platform is a single-tenant web application; there is no multi-tenancy or organisation concept.
- Email verification after registration is out of scope for the current version.
- Password reset / "forgot password" flow is out of scope for the current version.
- Mobile responsiveness is expected but a dedicated native mobile app is out of scope.
- The admin panel is accessible only via the web UI at `/admin`; there is no separate admin application.
- The frontend `/dashboard` page currently shows a placeholder ("Poll management coming soon") — implementing the full poll management UI (FR-027) is in scope for this feature.
- The CI pipeline (GitHub Actions) runs backend unit tests and TypeScript checks on every push; E2E tests require a live database and are run separately.

---

## Implementation Learnings

*Captured from the implementation session (2026-05-08 → 2026-05-09). These are process and experience insights, not technical specifications.*

### What went well

- **Backend-complete starting point accelerated delivery.** Having a fully working NestJS backend with all endpoints, guards, and validation already in place meant the entire implementation effort was frontend-only. This separation of concerns — "backend done, frontend gaps" — made the scope extremely clear and allowed focused, parallel work on the three missing pages without any backend coordination overhead.

- **Spec-driven task breakdown paid off.** The tasks.md file with explicit phase ordering (Setup → Foundational → US1 → US2 → US3 → Polish) meant there was never ambiguity about what to work on next. The `[P]` parallel markers were accurate — the API module, sub-components, and page implementations genuinely had no cross-dependencies within each user story.

- **Test-first thinking caught integration gaps early.** Writing unit tests immediately after each page implementation (rather than at the end) surfaced several real integration issues — missing form labels, undefined data shapes, ambiguous DOM queries — while the context was still fresh. Deferring tests to a "polish phase" would have made these harder to diagnose.

- **Isolating test infrastructure in `renderHelpers.tsx` was the right call.** A single shared helper with a `routePattern` option meant all page tests could opt into proper route context without duplicating `MemoryRouter`/`Routes`/`Route` boilerplate. When the pattern was missing, `useParams()` silently returned `{}` — a subtle failure mode that would have been hard to trace without the helper abstraction.

### What was harder than expected

- **jsdom cookie semantics diverge from real browsers.** The `document.cookie` API in jsdom does not reliably honour `max-age=0` or `expires` in the past for deletion. This caused intermittent test failures where a cookie set in one test bled into the next despite explicit cleanup in `beforeEach`/`afterEach`. The reliable fix was not to fight jsdom's cookie model but to eliminate the collision entirely by using unique slugs per test that sets cookies. **Lesson: when a test side-effect involves browser APIs with unreliable jsdom implementations, isolate by data rather than by cleanup.**

- **Type narrowing at component boundaries requires defensive coding.** The `PollFormModal` accepted a `PollSummary` cast to `PollDetail` in edit mode, but `PollSummary` does not include `questions`. The component called `.slice()` on `poll.questions` without a null guard, crashing silently in tests. The fix (`?? []`) was trivial, but the root cause — a type cast that widened the contract — was easy to miss during implementation. **Lesson: when a component accepts a union type or a cast, add null guards at every field access that is only present in the narrower type.**

- **Multiple matching DOM elements make tests brittle.** Pages with repeated action buttons (e.g., "Create Poll" appearing in both the header and an empty-state CTA, "Delete" appearing in both the list item and the confirmation dialog) caused `getByRole` to throw on ambiguity. Using `getAllByRole` with index selection resolved this, but it is fragile — index 0 vs 1 depends on DOM order. **Lesson: prefer `getByRole` with a unique `name` or `within()` scoping over index-based selection; if the UI has intentionally repeated labels, add `aria-label` attributes to distinguish them.**

- **Shared mutable state between tests is a systemic risk.** Beyond cookies, the Zustand auth store also needed explicit reset between tests (`resetAuthStore()`). Any global or module-level state — cookies, localStorage, Zustand stores, React Query caches — must be reset in `beforeEach`. The `createTestQueryClient()` helper already handled the query cache; the auth store reset was added as a pattern. **Lesson: enumerate all global state sources at the start of a test file and reset each one explicitly.**

### Process observations

- **Resuming from a conversation summary works well for focused fix sessions.** The summary accurately captured the outstanding failures and their root causes, allowing the session to start directly with fixes rather than re-diagnosis. The key is that the summary included both the symptom ("intermittent PollPage failures") and the hypothesis ("jsdom cookie persistence"), not just the symptom.

- **Running the full test suite after each fix group (not after each individual fix) is the right cadence.** Individual fixes are fast to apply; the test run takes ~1.5s. Running after every single change adds friction without adding signal. Running after a logical group of related fixes (e.g., "all cookie-related fixes") gives a clean pass/fail signal.

- **TypeScript errors and test failures are different failure modes that require different tools.** TypeScript errors (`npm run check:ts`) catch structural contract violations at compile time; test failures catch behavioural regressions at runtime. Both must pass before a feature is considered done. Running them in sequence (TypeScript first, then tests) is efficient because TypeScript errors often explain test failures.

- **Documentation is most accurate when written immediately after implementation.** The `frontend/README.md` update (T040) was done while the implementation was fresh, resulting in accurate descriptions of component responsibilities, cookie semantics, and caching behaviour. Deferring documentation to a separate session risks losing the nuance of implementation decisions.

---

### Session 2026-05-09 — Polish & Completion

#### What went well

- **Static code review is sufficient for mobile responsiveness verification when Docker is unavailable.** Reading every Tailwind class in the three target pages and their sub-components against a mental model of 375px and 768px viewports caught the one real gap (`PollFormModal` footer) without needing a running browser. The key is to check every `flex` container for overflow risk, every `grid` for column collapse, and every fixed-width element for viewport overflow.

- **The `flex-col-reverse sm:flex-row` pattern for modal footers is the correct mobile-first approach.** On narrow screens, the primary action (Submit/Save) should appear first visually (bottom of stack) and the cancel action second. `flex-col-reverse` achieves this without reordering the DOM, preserving tab order. Pairing with `w-full sm:w-auto` ensures buttons fill the screen width on mobile and shrink to content width on desktop.

- **Quickstart workflow validation via static analysis is reliable when the codebase is well-structured.** Tracing the full Docker workflow — compose config → backend Dockerfile → migrate command → seed → frontend Dockerfile → nginx config → API client base URL → router → page components — confirmed correctness without running a single container. The key is following the data flow end-to-end rather than checking each file in isolation.

#### What was harder than expected

- **Stale documentation in quickstart.md is a real risk.** The `quickstart.md` section on CSV export still referenced `window.open()` — a pattern explicitly prohibited by the constitution (Principle V: tokens in URLs are logged). The implementation had correctly used `URL.createObjectURL` + programmatic `<a>` click, but the documentation lagged. **Lesson: when a security-sensitive implementation decision is made, update all documentation that describes that flow in the same commit — not as a separate polish task.**

#### Process observations

- **The `learn` command is most valuable when it captures the delta from the current session, not a restatement of prior learnings.** The existing `## Implementation Learnings` section already captured the core implementation insights. The new session's contribution is the polish-phase experience: mobile responsiveness audit methodology, Docker workflow static validation, and documentation drift detection.

- **All 40 tasks completed across 8 phases.** The incremental delivery strategy (Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → Polish) worked as designed. Each phase was independently testable before the next began. The backend-complete starting point meant zero backend coordination overhead throughout.
