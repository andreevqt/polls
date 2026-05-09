# Polls

A full-stack polling platform. Users create polls with single-choice, multiple-choice, and free-text questions, share them via a direct link, and view response analytics. Anonymous respondents can take polls without an account; cookie-based deduplication prevents accidental re-submissions. An admin panel provides user and poll management.

**Stack:** NestJS · PostgreSQL · Prisma · React 19 · Vite · TanStack Query · Tailwind CSS

---

## Run with Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api/docs |

Seed demo accounts (run once after the stack is up):

```bash
cd backend && npx prisma db seed
```

Default credentials: `admin@example.com` / `Admin1234!` and `user@example.com` / `User1234!`

---

## Run locally

```bash
# Install all dependencies
npm install

# Backend — copy and edit backend/.env, then:
cd backend && npx prisma migrate deploy && npm run start:dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

---

## Commands (from repo root)

| Command | Description |
|---------|-------------|
| `npm test` | Unit tests (Jest + Vitest) |
| `npm run check:ts` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run start:dev` | Start backend in watch mode |
| `npm run test:e2e` | Backend E2E tests (requires database) |

For frontend E2E tests (Playwright): `cd frontend && npm run test:e2e`

---

## Docs

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
