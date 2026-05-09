# Feature Specification: Polls Platform

**Feature Branch**: `001-polls-platform`
**Created**: 2026-05-08
**Status**: Draft
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
