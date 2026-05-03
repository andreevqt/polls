# Polls App — Спецификация REST API

## Базовый URL
```
http://localhost:3000/api/v1
```

## Аутентификация
Все защищённые эндпоинты требуют:
```
Authorization: Bearer <access_token>
```
Refresh-токен хранится в httpOnly cookie с именем `refresh_token`.

---

## Эндпоинты аутентификации

### `POST /auth/register`
Регистрация нового пользователя.

**Тело запроса:**
```json
{
  "name": "Алиса",
  "email": "alice@example.com",
  "password": "StrongPass123!"
}
```

**Ответ `201`:**
```json
{
  "user": { "id": "uuid", "name": "Алиса", "email": "alice@example.com", "role": "USER" },
  "accessToken": "eyJ..."
}
```
Устанавливает httpOnly cookie `refresh_token`.

**Ошибки:** `400` ошибка валидации, `409` email уже существует

---

### `POST /auth/login`
**Тело запроса:**
```json
{ "email": "alice@example.com", "password": "StrongPass123!" }
```

**Ответ `200`:**
```json
{
  "user": { "id": "uuid", "name": "Алиса", "email": "alice@example.com", "role": "USER" },
  "accessToken": "eyJ..."
}
```
Устанавливает httpOnly cookie `refresh_token`.

**Ошибки:** `401` неверные учётные данные

---

### `POST /auth/refresh`
Использует cookie `refresh_token` для выдачи нового access-токена.

**Ответ `200`:**
```json
{ "accessToken": "eyJ..." }
```

**Ошибки:** `401` недействительный/истёкший refresh-токен

---

### `POST /auth/logout`
Инвалидирует refresh-токен.

**Ответ `204`:** Нет содержимого. Очищает cookie.

---

### `GET /auth/me`
Возвращает текущего авторизованного пользователя.

**Авторизация:** Обязательна

**Ответ `200`:**
```json
{ "id": "uuid", "name": "Алиса", "email": "alice@example.com", "role": "USER", "createdAt": "..." }
```

---

## Эндпоинты опросов

### `GET /polls`
Список публичных активных опросов (с пагинацией).

**Query-параметры:**
| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `page` | number | 1 | Номер страницы |
| `limit` | number | 20 | Элементов на странице |
| `search` | string | — | Поиск по названию |

**Ответ `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Любимый цвет?",
      "slug": "lyubimyy-tsvet-a3f2",
      "description": "...",
      "visibility": "PUBLIC",
      "expiresAt": null,
      "responseCount": 42,
      "owner": { "id": "uuid", "name": "Алиса" },
      "createdAt": "..."
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### `POST /polls`
Создание нового опроса.

**Авторизация:** Обязательна

**Тело запроса:**
```json
{
  "title": "Любимый цвет?",
  "description": "Выберите любимый",
  "visibility": "PUBLIC",
  "expiresAt": "2025-12-31T23:59:59Z",
  "questions": [
    {
      "text": "Какой ваш любимый цвет?",
      "type": "SINGLE_CHOICE",
      "orderIndex": 0,
      "isRequired": true,
      "options": [
        { "text": "Красный", "orderIndex": 0 },
        { "text": "Синий", "orderIndex": 1 },
        { "text": "Зелёный", "orderIndex": 2 }
      ]
    },
    {
      "text": "Есть ли комментарии?",
      "type": "TEXT",
      "orderIndex": 1,
      "isRequired": false,
      "options": []
    }
  ]
}
```

**Ответ `201`:**
```json
{
  "id": "uuid",
  "title": "Любимый цвет?",
  "slug": "lyubimyy-tsvet-a3f2",
  "accessToken": "uuid-для-приватного-доступа",
  "visibility": "PUBLIC",
  "expiresAt": "2025-12-31T23:59:59Z",
  "questions": [ ... ],
  "createdAt": "..."
}
```

**Ошибки:** `400` валидация, `401` не авторизован

---

### `GET /polls/:slug`
Получение деталей опроса с вопросами и вариантами ответов (для прохождения).

**Авторизация:** Опциональна (обязательна для приватных опросов через query-параметр `accessToken`)

**Query-параметры:**
| Параметр | Тип | Описание |
|---|---|---|
| `accessToken` | string | Обязателен для `PRIVATE` опросов |

**Ответ `200`:**
```json
{
  "id": "uuid",
  "title": "Любимый цвет?",
  "slug": "lyubimyy-tsvet-a3f2",
  "visibility": "PUBLIC",
  "isActive": true,
  "expiresAt": null,
  "owner": { "id": "uuid", "name": "Алиса" },
  "questions": [
    {
      "id": "uuid",
      "text": "Какой ваш любимый цвет?",
      "type": "SINGLE_CHOICE",
      "orderIndex": 0,
      "isRequired": true,
      "options": [
        { "id": "uuid", "text": "Красный", "orderIndex": 0 },
        { "id": "uuid", "text": "Синий", "orderIndex": 1 }
      ]
    }
  ]
}
```

**Ошибки:** `403` приватный опрос без токена, `404` не найден, `410` истёк срок

---

### `PATCH /polls/:slug`
Обновление метаданных опроса (название, описание, видимость, expiresAt, isActive).

**Авторизация:** Обязательна (владелец или admin)

**Тело запроса:** (все поля опциональны)
```json
{
  "title": "Обновлённое название",
  "visibility": "PRIVATE",
  "isActive": false,
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**Ответ `200`:** Обновлённый объект опроса.

**Ошибки:** `403` не владелец, `404` не найден

---

### `DELETE /polls/:slug`
Удаление опроса и всех его данных.

**Авторизация:** Обязательна (владелец или admin)

**Ответ `204`:** Нет содержимого.

---

### `POST /polls/:slug/regenerate-token`
Перегенерация приватного токена доступа.

**Авторизация:** Обязательна (владелец)

**Ответ `200`:**
```json
{ "accessToken": "новый-uuid" }
```

---

## Эндпоинты вопросов

### `PUT /polls/:slug/questions`
Полная замена всех вопросов опроса (полная замена для простоты редактора).

**Авторизация:** Обязательна (владелец)

**Тело запроса:**
```json
{
  "questions": [
    {
      "id": "существующий-uuid-или-null-для-нового",
      "text": "Обновлённый вопрос?",
      "type": "MULTIPLE_CHOICE",
      "orderIndex": 0,
      "isRequired": true,
      "options": [
        { "id": "существующий-uuid-или-null", "text": "Вариант А", "orderIndex": 0 },
        { "id": null, "text": "Вариант Б", "orderIndex": 1 }
      ]
    }
  ]
}
```

**Ответ `200`:** Полный обновлённый опрос с вопросами.

---

## Эндпоинты ответов

### `POST /polls/:slug/responses`
Отправка ответа на опрос.

**Авторизация:** Опциональна

**Тело запроса:**
```json
{
  "answers": [
    { "questionId": "uuid", "optionId": "uuid", "textValue": null },
    { "questionId": "uuid", "optionId": null, "textValue": "Мой комментарий" }
  ]
}
```

**Ответ `201`:**
```json
{ "id": "uuid", "submittedAt": "..." }
```

**Ошибки:** `400` не отвечены обязательные вопросы, `409` уже отвечал, `410` опрос истёк/неактивен, `403` нет доступа к приватному опросу

---

### `GET /polls/:slug/responses`
Получение всех ответов на опрос (только владелец/admin).

**Авторизация:** Обязательна (владелец или admin)

**Query-параметры:** `page`, `limit`

**Ответ `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "submittedAt": "...",
      "user": { "id": "uuid", "name": "Боб" },
      "answers": [
        { "questionId": "uuid", "optionId": "uuid", "textValue": null }
      ]
    }
  ],
  "total": 42
}
```

---

## Эндпоинты аналитики

### `GET /polls/:slug/analytics`
Получение агрегированной аналитики по опросу.

**Авторизация:** Обязательна (владелец или admin)

**Ответ `200`:**
```json
{
  "totalResponses": 42,
  "responsesOverTime": [
    { "date": "2025-01-01", "count": 5 },
    { "date": "2025-01-02", "count": 12 }
  ],
  "questions": [
    {
      "questionId": "uuid",
      "questionText": "Любимый цвет?",
      "type": "SINGLE_CHOICE",
      "totalAnswers": 42,
      "options": [
        { "optionId": "uuid", "text": "Красный", "count": 20, "percentage": 47.6 },
        { "optionId": "uuid", "text": "Синий", "count": 22, "percentage": 52.4 }
      ]
    },
    {
      "questionId": "uuid",
      "questionText": "Есть ли комментарии?",
      "type": "TEXT",
      "totalAnswers": 15,
      "textAnswers": ["Отличный опрос!", "Очень интересно", "..."]
    }
  ]
}
```

---

### `GET /polls/:slug/analytics/export`
Экспорт ответов в CSV.

**Авторизация:** Обязательна (владелец или admin)

**Ответ `200`:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="poll-slug-results.csv"`

Формат CSV:
```
response_id,submitted_at,user_name,В1: Любимый цвет?,В2: Есть ли комментарии?
uuid,2025-01-01T10:00:00Z,Боб,Красный,Отличный опрос!
```

---

## Эндпоинты администратора

### `GET /admin/users`
Список всех пользователей.

**Авторизация:** Обязательна (admin)

**Ответ `200`:** Пагинированный список пользователей.

---

### `PATCH /admin/users/:id`
Обновление роли пользователя.

**Авторизация:** Обязательна (admin)

**Тело запроса:**
```json
{ "role": "ADMIN" }
```

**Ответ `200`:** Обновлённый пользователь.

---

### `GET /admin/polls`
Список всех опросов (включая приватные).

**Авторизация:** Обязательна (admin)

**Ответ `200`:** Пагинированный список опросов.

---

## Формат ответа об ошибке

Все ошибки имеют следующую структуру:
```json
{
  "statusCode": 400,
  "message": "Ошибка валидации",
  "errors": [
    { "field": "email", "message": "должен быть корректным email" }
  ],
  "timestamp": "2025-01-01T00:00:00Z",
  "path": "/api/v1/auth/register"
}
```
