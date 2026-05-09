# Polls Backend

NestJS REST API for the polls application. Provides authentication, poll management, response collection, and analytics.

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10
- **ORM:** Prisma 5
- **Database:** PostgreSQL 16
- **Authentication:** JWT (access + refresh tokens)
- **Documentation:** Swagger / OpenAPI 3.0

---

## Requirements

- Node.js >= 20 (see `.nvmrc`)
- npm >= 10
- PostgreSQL 16 (local or via Docker)

---

## Quick Start

### 1. Install dependencies

From the monorepo root (recommended):

```bash
npm install
```

Or directly from the backend directory:

```bash
cd backend && npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/polls
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=3000
```

> ⚠️ Never commit `.env` to the repository. The file is listed in `.gitignore`.

### 3. Start PostgreSQL

If PostgreSQL is not installed locally, start it via Docker:

```bash
docker run -d \
  --name polls-postgres \
  -e POSTGRES_DB=polls \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16-alpine
```

Or via Docker Compose from the monorepo root (database only):

```bash
docker-compose up postgres -d
```

### 4. Apply migrations

```bash
cd backend
npx prisma migrate deploy
```

### 5. Start the server

```bash
# from the monorepo root
npm run start:dev

# or directly
cd backend && npm run start:dev
```

The server starts at `http://localhost:3000`.
Swagger UI: `http://localhost:3000/api/docs`

---

## Database Migrations

All Prisma commands are run from the `backend/` directory.

### Apply existing migrations

Used in CI and production — applies only already-created migrations without modifying the schema:

```bash
npx prisma migrate deploy
```

### Create a new migration (development)

After editing `prisma/schema.prisma`, create and apply a migration:

```bash
npx prisma migrate dev --name <migration_name>
```

Example names: `add_user_avatar`, `add_poll_tags`, `rename_response_field`.

The command:
1. Compares the current schema against the database state
2. Generates a SQL migration file in `prisma/migrations/`
3. Applies the migration to the local database
4. Regenerates the Prisma Client

### Check migration status

```bash
npx prisma migrate status
```

Shows which migrations have been applied and which are pending.

### Reset the database (development only!)

Drops all data and re-applies all migrations from scratch:

```bash
npx prisma migrate reset
```

> ⚠️ Never use in production — all data will be deleted.

### Roll back a migration

Prisma does not support automatic rollbacks. To roll back:

1. Create a new migration that reverts the changes:
   ```bash
   npx prisma migrate dev --name revert_<name>
   ```
2. Manually write the SQL in the migration file

### Regenerate Prisma Client

After changing the schema without creating a migration (e.g., adding only an index):

```bash
npx prisma generate
```

### Browse data in the browser (Prisma Studio)

Visual database editor:

```bash
npx prisma studio
```

Opens at `http://localhost:5555`.

---

## Development Workflow

### Typical cycle when changing the database schema

```
1. Edit prisma/schema.prisma
2. npx prisma migrate dev --name <change_description>
3. Prisma Client is regenerated automatically
4. Update services/DTOs for the new schema
5. Run tests: npm test
```

### Typical cycle when adding a new endpoint

```
1. Create/update DTO in src/<module>/dto/
2. Add method to service src/<module>/<module>.service.ts
3. Add endpoint to controller src/<module>/<module>.controller.ts
4. Write unit test in src/<module>/<module>.service.spec.ts
5. Add E2E test in test/app.e2e-spec.ts
6. Check types: npm run check:ts
7. Run tests: npm test && npm run test:e2e
```

### Debugging

Start with the debugger (Node.js inspector on port 9229):

```bash
cd backend && npm run start:debug
```

Connect via VS Code: `Run > Attach to Node Process`.

---

## Available Scripts

### From the monorepo root

| Command | Description |
|---|---|
| `npm run start:dev` | Start the backend in development mode |
| `npm test` | Run unit tests in all workspaces |
| `npm run test:e2e` | Run backend E2E tests |
| `npm run check:ts` | TypeScript check in all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run build` | Build all workspaces |

### From the `backend/` directory

| Command | Description |
|---|---|
| `npm run start:dev` | Start in development mode with hot-reload |
| `npm run start:prod` | Start the compiled application |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run check:ts` | TypeScript type check without compilation |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run E2E tests (requires database) |
| `npm run lint` | Lint the code |
| `npm run format` | Format code with Prettier |

---

## API Documentation

After starting the server, Swagger UI is available at:

```
http://localhost:3000/api/docs
```

### Base URL

```
http://localhost:3000/api/v1
```

### Key Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register a user | — |
| `POST` | `/auth/login` | Log in | — |
| `POST` | `/auth/refresh` | Refresh access token | cookie |
| `POST` | `/auth/logout` | Log out | Bearer |
| `GET` | `/auth/me` | Current user | Bearer |
| `GET` | `/polls` | List public polls | — |
| `POST` | `/polls` | Create a poll | Bearer |
| `GET` | `/polls/my` | My polls | Bearer |
| `GET` | `/polls/:slug` | Get a poll | optional |
| `PATCH` | `/polls/:slug` | Update a poll | Bearer (owner) |
| `DELETE` | `/polls/:slug` | Delete a poll | Bearer (owner) |
| `PUT` | `/polls/:slug/questions` | Replace questions | Bearer (owner) |
| `POST` | `/polls/:slug/responses` | Submit a response | optional |
| `GET` | `/polls/:slug/responses` | Get responses | Bearer (owner) |
| `GET` | `/polls/:slug/analytics` | Poll analytics | Bearer (owner) |
| `GET` | `/polls/:slug/analytics/export` | Export to CSV | Bearer (owner) |
| `GET` | `/admin/users` | List users | Bearer (admin) |
| `PATCH` | `/admin/users/:id` | Change role | Bearer (admin) |
| `GET` | `/admin/polls` | All polls | Bearer (admin) |

---

## Tests

### Unit tests

```bash
# from the monorepo root
npm test

# or from backend/
cd backend && npm test
```

Covers all services (`AuthService`, `PollsService`, `ResponsesService`, `AnalyticsService`, `UsersService`) and utilities. Uses mocks — no database required.

### E2E tests

Require a running database:

```bash
# ensure the database is running
docker-compose up postgres -d

# from the monorepo root
npm run test:e2e

# or from backend/
cd backend && npm run test:e2e
```

E2E tests cover the full cycle: registration → login → poll creation → response submission → analytics → deletion.

### Code coverage

```bash
cd backend && npm run test:cov
```

Report is saved to `backend/coverage/`.

### TypeScript type check

```bash
# from the monorepo root
npm run check:ts

# or from backend/
cd backend && npm run check:ts
```

---

## Running via Docker Compose

From the monorepo root, start the full stack (PostgreSQL + backend):

```bash
docker-compose up --build
```

PostgreSQL only (for local development):

```bash
docker-compose up postgres -d
```

---

## Project Structure

```
backend/
├── src/
│   ├── auth/               # Authentication (JWT, strategies, guards)
│   │   ├── dto/            # RegisterDto, LoginDto
│   │   ├── guards/         # JwtAuthGuard, JwtRefreshGuard, OptionalJwtGuard
│   │   └── strategies/     # JwtStrategy, JwtRefreshStrategy
│   ├── users/              # User management
│   ├── polls/              # Poll CRUD
│   │   ├── dto/            # CreatePollDto, UpdatePollDto, PollQueryDto
│   │   └── guards/         # PollOwnerGuard
│   ├── questions/          # Question management (ReplaceQuestionsDto)
│   ├── responses/          # Response submission and retrieval
│   ├── analytics/          # Analytics and CSV export
│   ├── admin/              # Admin endpoints
│   │   └── guards/         # AdminGuard
│   ├── common/
│   │   ├── decorators/     # @CurrentUser(), @Public()
│   │   ├── filters/        # HttpExceptionFilter
│   │   └── utils/          # generateSlug(), getPaginationParams()
│   ├── prisma/             # PrismaService and PrismaModule
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # SQL migrations
├── test/
│   ├── app.e2e-spec.ts     # E2E tests
│   └── jest-e2e.json       # Jest config for E2E
├── .env.example
├── Dockerfile
└── package.json
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/polls` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | `change_me_access` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | `change_me_refresh` |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `PORT` | Server port | `3000` |
