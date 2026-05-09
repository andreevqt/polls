# Polls Frontend

React application for creating and taking polls. Includes a public interface, a user dashboard, and a full-featured admin panel.

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Bundler:** Vite 5
- **UI:** React 18 + TypeScript
- **Styles:** Tailwind CSS 3
- **Routing:** React Router v7
- **API requests:** TanStack React Query v5
- **State:** Zustand (access token in memory only)
- **Forms:** react-hook-form + Zod
- **Charts:** Recharts
- **HTTP client:** Axios (with automatic refresh on 401)

---

## Requirements

- Node.js >= 20 (see `.nvmrc`)
- npm >= 10
- Backend running at `http://localhost:3000`

---

## Quick Start

### 1. Install dependencies

```bash
cd frontend && npm install
```

### 2. Configure environment variables

```bash
cp frontend/.env.example frontend/.env
```

Contents of `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

> ⚠️ Never commit `.env` to the repository.

### 3. Start the dev server

```bash
cd frontend && npm run dev
```

The application opens at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Production build (`tsc -b && vite build`) |
| `npm run preview` | Preview the production build |
| `npm run check:ts` | TypeScript type check without compilation |
| `npm run lint` | Lint code with ESLint |
| `npm test` | Run unit tests (Vitest, single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright) |

---

## Project Structure

```
frontend/
├── e2e/                        # Playwright E2E tests
│   ├── admin/                  # Admin panel tests
│   └── helpers/                # Helper utilities (auth, etc.)
├── public/                     # Static files
├── src/
│   ├── api/                    # API functions
│   │   ├── client.ts           # Axios instance with interceptors (Bearer + refresh)
│   │   ├── auth.ts             # login, register, logout, getMe, refresh
│   │   ├── polls.ts            # All poll endpoints (CRUD, analytics, export)
│   │   └── admin.ts            # All admin endpoints
│   ├── components/
│   │   ├── admin/              # Admin panel components
│   │   │   ├── AdminLayout.tsx     # Wrapper with sidebar
│   │   │   ├── AdminSidebar.tsx    # Navigation (Dashboard/Users/Polls/Analytics/System)
│   │   │   ├── AdminHeader.tsx     # Page header + action button
│   │   │   ├── StatCard.tsx        # Metric card
│   │   │   ├── BulkActions.tsx     # Bulk operations panel
│   │   │   ├── AdvancedFilters.tsx # Advanced filters
│   │   │   └── ExportButton.tsx    # CSV/JSON export
│   │   ├── polls/              # Poll components
│   │   │   ├── QuestionRenderer.tsx    # Renders a question (radio/checkbox/textarea)
│   │   │   ├── PollFormModal.tsx       # Create/edit poll modal
│   │   │   ├── PollListItem.tsx        # Poll row in the dashboard list
│   │   │   ├── AnalyticsChart.tsx      # Recharts LineChart for response timeline
│   │   │   └── QuestionAnalyticsCard.tsx # Per-question answer breakdown
│   │   ├── ui/                 # Base UI components (Button, Badge, Spinner)
│   │   ├── AdminRoute.tsx      # Guard: ADMIN role only
│   │   └── ProtectedRoute.tsx  # Guard: authenticated users only
│   ├── pages/
│   │   ├── admin/              # Admin panel pages
│   │   │   ├── AdminDashboardPage.tsx  # Stats + recent polls
│   │   │   ├── AdminUsersPage.tsx      # User management
│   │   │   ├── AdminPollsPage.tsx      # Poll management
│   │   │   ├── AdminAnalyticsPage.tsx  # Charts and analytics
│   │   │   └── AdminSystemPage.tsx     # System health monitoring
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── PollPage.tsx            # Public poll-taking page (/{slug})
│   │   ├── DashboardPage.tsx       # User poll management (/dashboard)
│   │   ├── PollAnalyticsPage.tsx   # Poll analytics (/dashboard/polls/:slug/analytics)
│   │   └── NotFoundPage.tsx
│   ├── store/
│   │   └── authStore.ts        # Zustand: user + accessToken (memory only)
│   ├── types/                  # TypeScript types (User, Poll, Analytics)
│   ├── utils/
│   │   └── export.ts           # toCSV(), downloadCSV(), downloadJSON()
│   ├── test/                   # Test utilities
│   │   ├── factories.ts        # Test data factories
│   │   ├── renderHelpers.tsx   # renderWithProviders()
│   │   └── setup.ts            # Global test setup
│   ├── App.tsx                 # QueryClientProvider + session restore
│   ├── main.tsx                # Entry point (createRoot)
│   └── router.tsx              # Routes (public / protected / admin)
├── .env.example
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
└── package.json
```

---

## Routes

### Public

| Path | Page |
|---|---|
| `/` | Landing |
| `/login` | Login |
| `/register` | Register |
| `/:slug` | Poll-taking page (`PollPage`) |

### Protected (require authentication)

| Path | Page |
|---|---|
| `/dashboard` | User poll management (`DashboardPage`) |
| `/dashboard/polls/:slug/analytics` | Poll analytics (`PollAnalyticsPage`) |

### Admin (require `role === ADMIN`)

| Path | Page |
|---|---|
| `/admin` | Dashboard: stats + recent polls |
| `/admin/users` | User management |
| `/admin/polls` | Poll management |
| `/admin/analytics` | Charts and analytics |
| `/admin/system` | System monitoring |

---

## New Pages

### `PollPage` — public poll-taking page (`/:slug`)

Accessible without authentication. Loads the poll by slug via `GET /api/v1/polls/:slug`.

**Behaviour:**
- If `document.cookie` contains `responded_<slug>=true` — immediately shows the "Already responded" state without making an API call.
- Supports private polls: reads `?accessToken=` from the URL and passes it in the request.
- Renders the form with questions via `QuestionRenderer` (radio / checkbox / textarea).
- After a successful submission (`201`), sets the cookie and shows the thank-you screen **in place of the form** (no page navigation).
- Handles errors: `403` → "Access denied", `410` → "Poll unavailable", `409` → inline duplicate error message.

**Cookie deduplication:**

After a successful response submission, the browser receives a cookie:

```
responded_<slug>=true; SameSite=Lax; path=/
```

When the user revisits `/<slug>`, the component reads `document.cookie` **before** making an API call. If the cookie is found, the form is not shown and no API call is made. This is a client-side guard against accidental re-submissions; server-side deduplication works independently via `respondentFingerprint` (a UUID stored in `localStorage` under the key `respondent_id`).

---

### `DashboardPage` — poll management (`/dashboard`)

Protected page. Shows the current user's list of polls.

**Features:**
- Create a poll via `PollFormModal` ("Create Poll" button).
- Edit metadata and questions via the same modal in edit mode.
- Delete a poll with a confirmation dialog.
- Toggle active status, copy the shareable link, regenerate the access token (for private polls).
- Navigate to the analytics page via the "Analytics" button in `PollListItem`.
- Empty state when the user has no polls.

**Components:**
- [`PollFormModal`](src/components/polls/PollFormModal.tsx) — form with `react-hook-form` + Zod; supports 1–20 questions, adding/removing answer options. On mobile (≤375px) the footer buttons stack vertically (`flex-col-reverse`) with full-width buttons.
- [`PollListItem`](src/components/polls/PollListItem.tsx) — poll card with badges, response count, and action buttons.

---

### `PollAnalyticsPage` — poll analytics (`/dashboard/polls/:slug/analytics`)

Protected page. Accessible only to the poll owner.

**Displays:**
- Total response count.
- Response timeline chart by day (`AnalyticsChart` based on Recharts `LineChart`).
- Per-question breakdown (`QuestionAnalyticsCard`): bars with percentages for choice questions, answer list for text questions.
- "Export CSV" button — downloads the file via `Blob` + `URL.createObjectURL` (the auth token never appears in the URL).

**Caching:** data is cached for 30 seconds (`staleTime: 30_000`) to reduce load on frequent navigation.

---

## Authentication

- `accessToken` is stored **in memory only** (Zustand), never in `localStorage`
- `refreshToken` is an httpOnly cookie set by the backend
- On 401, the Axios interceptor automatically calls `POST /auth/refresh` and retries the request
- On app start (`App.tsx`), `POST /auth/refresh` → `GET /auth/me` is called to restore the session

---

## Tests

### Unit tests (Vitest + React Testing Library)

```bash
cd frontend && npm test
```

Covers all admin components, pages, API functions, and utilities. No database required.

```bash
# with coverage report
npm run test:coverage
```

Report is saved to `frontend/coverage/`.

### E2E tests (Playwright)

Require a running backend and frontend:

```bash
# start the backend (in a separate terminal)
cd backend && npm run start:dev

# run E2E tests
cd frontend && npm run test:e2e
```

Tests cover: login/logout, route protection, admin panel navigation, search, filtering, bulk operations, and export.

### Type check

```bash
cd frontend && npm run check:ts
```

---

## Development Workflow

### Typical cycle when adding a new admin section

```
1. Add API functions to src/api/admin.ts
2. Add TypeScript types to src/types/
3. Create the page in src/pages/admin/
4. Register the route in src/router.tsx
5. Add the item to AdminSidebar.tsx
6. Write tests in src/pages/admin/__tests__/
7. Check types: npm run check:ts
8. Run tests: npm test
```

### Typical cycle when changing the API

```
1. Update functions in src/api/
2. Update types in src/types/
3. Update components that use the changed data
4. Update tests in src/api/__tests__/
5. Check types: npm run check:ts
```

### Debugging

The dev server runs with HMR — changes are applied without a page reload.

For debugging network requests, use the Network tab in DevTools or React Query Devtools (add when needed).

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api/v1` |

---

## Running via Docker Compose

From the monorepo root, start the full stack:

```bash
docker-compose up --build
```

The frontend will be available at `http://localhost:5173`.
