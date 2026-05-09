# Quickstart: Polls Platform

**Branch**: `001-polls-platform` | **Phase**: 1 | **Date**: 2026-05-08

This guide covers how to run the full stack locally, run all test suites, and understand the
key development workflows for this feature.

---

## Prerequisites

- Node.js `>=20.0.0` and npm `>=10.0.0`
- Docker and Docker Compose (for the full stack)
- A running PostgreSQL instance (if running backend without Docker)

Check versions:
```bash
node --version   # must be >= 20
npm --version    # must be >= 10
docker --version
```

---

## 1. Full Stack (Docker Compose — recommended)

Brings up PostgreSQL, the NestJS backend, and the Vite frontend in one command:

```bash
# From the repo root
docker compose up --build
```

Services:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5432 |

The `docker-compose.yml` runs `prisma migrate deploy` before starting the backend, so the
database schema is applied automatically.

To stop:
```bash
docker compose down
```

To reset the database (drop all data):
```bash
docker compose down -v
docker compose up --build
```

---

## 2. Local Development (without Docker)

### 2a. Backend

```bash
# Ensure PostgreSQL is running and DATABASE_URL is set
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

cd backend
npm install
npx prisma migrate dev      # apply migrations + generate Prisma client
npx prisma db seed          # optional: seed demo data
npm run start:dev           # watch mode
```

Backend runs at `http://localhost:3000`. Swagger UI at `http://localhost:3000/api/docs`.

### 2b. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. It proxies `/api` to `http://localhost:3000` via
the Vite dev server config.

---

## 3. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default: `7d`) |
| `PORT` | No | HTTP port (default: `3000`) |
| `THROTTLE_TTL` | No | Rate limit window in ms (default: `60000`) |
| `THROTTLE_LIMIT` | No | Max requests per window (default: `10`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | Backend API base URL (default: `http://localhost:3000/api/v1`) |

---

## 4. Running Tests

### Root (all workspaces)

```bash
# From repo root
npm run test          # unit tests (backend Jest + frontend Vitest)
npm run check:ts      # TypeScript check for both workspaces
npm run lint          # ESLint for both workspaces
```

### Backend unit tests

```bash
cd backend
npm run test          # Jest unit tests
npm run test:cov      # with coverage report
npm run test:watch    # watch mode
```

### Backend E2E tests (requires live PostgreSQL)

```bash
cd backend
npm run test:e2e      # supertest against real Postgres (uses TEST_DATABASE_URL)
```

Set `TEST_DATABASE_URL` in `backend/.env` or export it before running.

### Frontend unit tests (Vitest)

```bash
cd frontend
npm run test          # Vitest
npm run test:ui       # Vitest with browser UI
npm run test:coverage # with coverage
```

### Frontend E2E tests (Playwright)

```bash
cd frontend
# Requires the full stack to be running (docker compose up or local dev)
npm run test:e2e              # headless
npm run test:e2e -- --ui      # with Playwright UI
npm run test:e2e -- --headed  # headed browser
```

Playwright config: [`frontend/playwright.config.ts`](../../frontend/playwright.config.ts)

---

## 5. Database Operations

```bash
cd backend

# Apply pending migrations (production-safe)
npx prisma migrate deploy

# Create a new migration after editing schema.prisma
npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (GUI for the database)
npx prisma studio

# Regenerate Prisma client (after schema changes)
npx prisma generate

# Seed the database with demo data
npx prisma db seed
```

---

## 6. Key Development Workflows for This Feature

### Adding the public poll-taking page (`/{slug}`)

1. Create `frontend/src/pages/PollPage.tsx`
2. Add the route in [`frontend/src/router.tsx`](../../frontend/src/router.tsx) — insert `{ path: '/:slug', element: <PollPage /> }` **after** all named routes and **before** the `*` catch-all
3. Add API calls in `frontend/src/api/polls.ts`:
   - `getPollBySlug(slug, accessToken?)` → `GET /api/v1/polls/:slug`
   - `submitResponse(slug, payload)` → `POST /api/v1/polls/:slug/responses`
4. Cookie deduplication: read `responded_<slug>` cookie on mount; set it after successful submission

### Implementing the dashboard poll management UI

1. Replace the placeholder in [`frontend/src/pages/DashboardPage.tsx`](../../frontend/src/pages/DashboardPage.tsx)
2. Use TanStack Query for:
   - `useQuery(['my-polls'])` → `GET /api/v1/polls/my`
   - `useMutation` for create, update, delete, replace-questions
3. Use react-hook-form + Zod for the create/edit form
4. Validate: 1–20 questions, at least 1 option per choice question

### Adding the analytics page

1. Create `frontend/src/pages/PollAnalyticsPage.tsx`
2. Add route: `{ path: '/dashboard/polls/:slug/analytics', element: <PollAnalyticsPage /> }` (protected)
3. Use TanStack Query: `useQuery(['analytics', slug])` → `GET /api/v1/analytics/:slug`
4. Recharts `LineChart` for `responsesOverTime`
5. CSV export: `GET /api/v1/analytics/:slug/export` — fetch via `apiClient` with `responseType: 'blob'`, create a temporary object URL via `URL.createObjectURL(blob)`, trigger download via a programmatic `<a>` click, then revoke the URL. **Do NOT use `window.open` or embed the auth token in the URL** (tokens in URLs are logged by servers/proxies).

---

## 7. Swagger / API Exploration

The backend exposes a Swagger UI at `http://localhost:3000/api/docs` when running locally.
All endpoints are documented with request/response schemas via `@nestjs/swagger` decorators.

For the full contract reference, see [`specs/001-polls-platform/contracts/api.md`](./contracts/api.md).

---

## 8. Useful npm Scripts (root `package.json`)

| Script | Description |
|--------|-------------|
| `npm run build` | Build both workspaces |
| `npm run test` | Run all unit tests |
| `npm run check:ts` | TypeScript check (both workspaces) |
| `npm run lint` | ESLint (both workspaces) |
| `npm run start:dev` | Start backend in watch mode |

---

## 9. CI Pipeline

GitHub Actions runs on every push and PR:

1. **TypeScript check** — `npm run check:ts` (both workspaces)
2. **Backend unit tests** — Jest with coverage
3. **Backend E2E tests** — supertest against a Postgres service container
4. **Frontend unit tests** — Vitest with coverage
5. **Frontend E2E tests** — Playwright against a live backend

See [`.github/workflows/backend-ci.yml`](../../.github/workflows/backend-ci.yml) for the
current workflow definition.

A failing test or TypeScript error **blocks merge** — no `--no-verify`, no skipped suites.
