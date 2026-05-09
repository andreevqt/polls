# API Contract: Polls Platform

**Branch**: `001-polls-platform` | **Phase**: 1 | **Date**: 2026-05-08
**Base URL**: `http://localhost:3000/api/v1`
**API Version**: v1 (stable — no breaking changes within v1 per constitution Principle IV)

All endpoints return JSON. Errors follow the NestJS default shape:
```json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
```

Authentication uses `Authorization: Bearer <accessToken>` header. The refresh token is stored in an HTTP-only cookie (`refresh_token`) and is sent automatically by the browser.

---

## Auth Endpoints

### POST /auth/register

Register a new user account.

**Auth**: None
**Rate limit**: Yes (throttler default)

**Request body**:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Validation**:
- `name`: non-empty string
- `email`: valid email format
- `password`: minimum 8 characters

**Response `201`**:
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "USER"
  }
}
```
Sets `refresh_token` HTTP-only cookie.

**Errors**:
- `409 Conflict` — email already registered

---

### POST /auth/login

Authenticate with email and password.

**Auth**: None
**Rate limit**: Yes (throttler default)

**Request body**:
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response `200`**:
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "USER"
  }
}
```
Sets `refresh_token` HTTP-only cookie.

**Errors**:
- `401 Unauthorized` — invalid credentials

---

### POST /auth/refresh

Issue a new access token using the refresh token cookie.

**Auth**: None (uses `refresh_token` cookie)

**Response `200`**:
```json
{ "accessToken": "eyJ..." }
```
Rotates the `refresh_token` cookie (old token invalidated).

**Errors**:
- `401 Unauthorized` — missing or expired refresh token

---

### POST /auth/logout

Invalidate the current refresh token server-side.

**Auth**: None (uses `refresh_token` cookie)

**Response `200`**:
```json
{ "message": "Logged out" }
```
Clears the `refresh_token` cookie.

---

## Poll Endpoints

### GET /polls

List all public, active, non-expired polls.

**Auth**: None

**Query parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `search` | string | — | Filter by title (case-insensitive) |

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My Poll",
      "slug": "my-poll",
      "description": "Optional description",
      "visibility": "PUBLIC",
      "isActive": true,
      "expiresAt": null,
      "responseCount": 42,
      "owner": { "id": "uuid", "name": "Alice" },
      "createdAt": "2026-05-08T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### GET /polls/my

List polls owned by the authenticated user (all statuses).

**Auth**: Required (JWT)

**Query parameters**: same as `GET /polls`

**Response `200`**: same shape as `GET /polls` (includes `updatedAt` field)

---

### GET /polls/:slug

Get a single poll with all questions and options.

**Auth**: None (public polls); access token required for PRIVATE polls

**Query parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `accessToken` | string | Required for PRIVATE polls |

**Response `200`**:
```json
{
  "id": "uuid",
  "title": "My Poll",
  "slug": "my-poll",
  "description": null,
  "visibility": "PUBLIC",
  "isActive": true,
  "expiresAt": null,
  "accessToken": "uuid",
  "owner": { "id": "uuid", "name": "Alice" },
  "questions": [
    {
      "id": "uuid",
      "text": "What is your favourite colour?",
      "type": "SINGLE_CHOICE",
      "orderIndex": 0,
      "isRequired": true,
      "options": [
        { "id": "uuid", "text": "Red", "orderIndex": 0 },
        { "id": "uuid", "text": "Blue", "orderIndex": 1 }
      ]
    },
    {
      "id": "uuid",
      "text": "Any comments?",
      "type": "TEXT",
      "orderIndex": 1,
      "isRequired": false,
      "options": []
    }
  ],
  "createdAt": "2026-05-08T00:00:00.000Z",
  "updatedAt": "2026-05-08T00:00:00.000Z"
}
```

**Errors**:
- `404 Not Found` — poll not found
- `403 Forbidden` — PRIVATE poll, missing or invalid access token
- `410 Gone` — poll has expired

---

### POST /polls

Create a new poll.

**Auth**: Required (JWT)

**Request body**:
```json
{
  "title": "My Poll",
  "description": "Optional description",
  "visibility": "PUBLIC",
  "expiresAt": null,
  "questions": [
    {
      "text": "What is your favourite colour?",
      "type": "SINGLE_CHOICE",
      "orderIndex": 0,
      "isRequired": true,
      "options": [
        { "text": "Red", "orderIndex": 0 },
        { "text": "Blue", "orderIndex": 1 }
      ]
    }
  ]
}
```

**Validation**:
- `title`: non-empty string
- `visibility`: `PUBLIC` or `PRIVATE`
- `questions`: 1–20 items
- Each `SINGLE_CHOICE` / `MULTIPLE_CHOICE` question: at least 1 option
- Each `TEXT` question: no options

**Response `201`**: full poll object (same shape as `GET /polls/:slug`)

**Errors**:
- `400 Bad Request` — validation failure

---

### PATCH /polls/:slug

Update poll metadata (title, description, visibility, isActive, expiresAt).

**Auth**: Required (JWT, must be poll owner)

**Request body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "New description",
  "visibility": "PRIVATE",
  "isActive": false,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

**Response `200`**: full poll object

**Errors**:
- `403 Forbidden` — not the poll owner
- `404 Not Found` — poll not found

---

### PUT /polls/:slug/questions

Replace the entire question set. **Deletes all existing answers.**

**Auth**: Required (JWT, must be poll owner)

**Request body**:
```json
{
  "questions": [
    {
      "text": "New question?",
      "type": "MULTIPLE_CHOICE",
      "orderIndex": 0,
      "isRequired": true,
      "options": [
        { "text": "Option A", "orderIndex": 0 },
        { "text": "Option B", "orderIndex": 1 }
      ]
    }
  ]
}
```

**Validation**: same as `POST /polls` questions array (1–20 items)

**Response `200`**: full poll object with new questions

**Errors**:
- `403 Forbidden` — not the poll owner
- `404 Not Found` — poll not found

---

### DELETE /polls/:slug

Delete a poll and all associated data.

**Auth**: Required (JWT, must be poll owner)

**Response `204`**: no body

**Errors**:
- `403 Forbidden` — not the poll owner
- `404 Not Found` — poll not found

---

### POST /polls/:slug/regenerate-token

Regenerate the access token for a PRIVATE poll. Invalidates all previous links.

**Auth**: Required (JWT, must be poll owner)

**Response `200`**:
```json
{ "accessToken": "new-uuid" }
```

**Errors**:
- `403 Forbidden` — not the poll owner
- `404 Not Found` — poll not found

---

## Response Submission Endpoints

### POST /polls/:slug/responses

Submit a response to a poll.

**Auth**: Optional (JWT if authenticated; anonymous otherwise)
**Rate limit**: Yes — per IP, returns `429 Too Many Requests` on breach (FR-028, SC-010)

**Request body**:
```json
{
  "answers": [
    { "questionId": "uuid", "optionId": "uuid" },
    { "questionId": "uuid", "optionIds": ["uuid1", "uuid2"] },
    { "questionId": "uuid", "textValue": "My answer" }
  ],
  "respondentFingerprint": "uuid-from-localstorage"
}
```

**Answer shape by question type**:
| Question type | Required fields |
|---------------|----------------|
| `SINGLE_CHOICE` | `optionId` |
| `MULTIPLE_CHOICE` | `optionIds` (array, ≥1 item) |
| `TEXT` | `textValue` |

**Response `201`**:
```json
{
  "id": "uuid",
  "submittedAt": "2026-05-08T12:00:00.000Z"
}
```

**Errors**:
- `400 Bad Request` — required question unanswered, or invalid answer shape
- `403 Forbidden` — PRIVATE poll, missing access token
- `404 Not Found` — poll not found
- `409 Conflict` — duplicate response (authenticated user already responded)
- `410 Gone` — poll inactive or expired
- `429 Too Many Requests` — rate limit exceeded

---

### GET /polls/:slug/responses

List all responses for a poll (paginated).

**Auth**: Required (JWT, must be poll owner)

**Query parameters**: `page`, `limit`

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "submittedAt": "2026-05-08T12:00:00.000Z",
      "user": { "id": "uuid", "name": "Alice" },
      "answers": [
        { "questionId": "uuid", "optionId": "uuid", "textValue": null }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

## Analytics Endpoints

### GET /analytics/:slug

Get analytics for a poll.

**Auth**: Required (JWT, must be poll owner)

**Response `200`**:
```json
{
  "totalResponses": 42,
  "responsesOverTime": [
    { "date": "2026-05-08", "count": 10 },
    { "date": "2026-05-09", "count": 32 }
  ],
  "questions": [
    {
      "questionId": "uuid",
      "questionText": "Favourite colour?",
      "type": "SINGLE_CHOICE",
      "totalAnswers": 42,
      "options": [
        { "optionId": "uuid", "text": "Red", "count": 25, "percentage": 59.5 },
        { "optionId": "uuid", "text": "Blue", "count": 17, "percentage": 40.5 }
      ]
    },
    {
      "questionId": "uuid",
      "questionText": "Any comments?",
      "type": "TEXT",
      "totalAnswers": 15,
      "textAnswers": ["Great poll!", "Very interesting."]
    }
  ]
}
```

**Errors**:
- `403 Forbidden` — not the poll owner
- `404 Not Found` — poll not found

---

### GET /analytics/:slug/export

Export all responses as a CSV file.

**Auth**: Required (JWT, must be poll owner)

**Response `200`**:
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="<slug>-results.csv"`

**CSV columns**: `response_id`, `submitted_at`, `user_name`, `Q1: <text>`, `Q2: <text>`, …

**Errors**:
- `403 Forbidden` — not the poll owner
- `404 Not Found` — poll not found

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <accessToken>` where the user has `role = ADMIN`. Non-admin authenticated users receive `403`. Unauthenticated requests receive `401`.

### GET /admin/stats

Dashboard statistics.

**Auth**: Required (ADMIN role)

**Response `200`**:
```json
{
  "totalUsers": 100,
  "totalPolls": 50,
  "activePolls": 30
}
```

---

### GET /admin/users

List all users with filtering and pagination.

**Auth**: Required (ADMIN role)

**Query parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `search` | string | Filter by name or email |
| `role` | `USER` \| `ADMIN` | Filter by role |
| `sortBy` | string | Field to sort by |
| `sortOrder` | `asc` \| `desc` | Sort direction |

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "USER",
      "createdAt": "2026-05-08T00:00:00.000Z",
      "_count": { "polls": 3, "responses": 12 }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### PATCH /admin/users/:id

Update a user's role.

**Auth**: Required (ADMIN role)

**Request body**:
```json
{ "role": "ADMIN" }
```

**Response `200`**: updated user object

---

### POST /admin/users/bulk

Bulk update or delete users.

**Auth**: Required (ADMIN role)

**Request body**:
```json
{
  "ids": ["uuid1", "uuid2"],
  "action": "delete"
}
```
or
```json
{
  "ids": ["uuid1", "uuid2"],
  "action": "setRole",
  "role": "ADMIN"
}
```

**Response `200`**:
```json
{ "affected": 2 }
```

---

### GET /admin/polls

List all polls in the system.

**Auth**: Required (ADMIN role)

**Query parameters**: `page`, `limit`, `search`, `visibility`, `isActive`, `sortBy`, `sortOrder`

**Response `200`**: same shape as `GET /polls` (includes all polls regardless of status)

---

### DELETE /admin/polls/:id

Delete any poll by ID.

**Auth**: Required (ADMIN role)

**Response `204`**: no body

---

## Frontend Cookie Protocol

The frontend manages one cookie per poll submission:

| Cookie name | Value | Scope | Lifetime |
|-------------|-------|-------|---------|
| `responded_<slug>` | `true` | `path=/` | Session (or 1 year — implementation choice) |

This cookie is **set by the frontend** after a `201` response from `POST /polls/:slug/responses`. It is **read by the frontend** on `PollPage` mount to show the "already responded" state without a server round-trip (FR-004, SC-002).
