# Polls Backend

NestJS REST API для приложения опросов. Предоставляет аутентификацию, управление опросами, сбор ответов и аналитику.

## Технологический стек

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 10
- **ORM:** Prisma 5
- **База данных:** PostgreSQL 16
- **Аутентификация:** JWT (access + refresh токены)
- **Документация:** Swagger / OpenAPI 3.0

---

## Требования

- Node.js >= 20
- npm >= 9
- PostgreSQL 16 (локально или через Docker)

---

## Быстрый старт

### 1. Установить зависимости

```bash
cd backend
npm install
```

### 2. Настроить переменные окружения

```bash
cp .env.example .env
```

Отредактировать `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/polls
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### 3. Запустить PostgreSQL

Если PostgreSQL не установлен локально, можно поднять через Docker:

```bash
docker run -d \
  --name polls-postgres \
  -e POSTGRES_DB=polls \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. Применить миграции базы данных

```bash
npx prisma migrate deploy
```

Для разработки (создаёт новую миграцию при изменении схемы):

```bash
npx prisma migrate dev
```

### 5. Запустить сервер

**Режим разработки** (с hot-reload):

```bash
npm run start:dev
```

**Продакшн-режим:**

```bash
npm run build
npm run start:prod
```

Сервер запустится на `http://localhost:3000`.

---

## Запуск через Docker Compose

Из корня монорепозитория запустить весь стек (PostgreSQL + backend + frontend):

```bash
docker-compose up --build
```

Только backend + база данных:

```bash
docker-compose up postgres backend
```

---

## Доступные скрипты

| Команда | Описание |
|---|---|
| `npm run start:dev` | Запуск в режиме разработки с hot-reload |
| `npm run start:prod` | Запуск собранного приложения |
| `npm run build` | Сборка TypeScript в `dist/` |
| `npm test` | Запуск unit-тестов |
| `npm run test:watch` | Запуск тестов в watch-режиме |
| `npm run test:cov` | Запуск тестов с отчётом о покрытии |
| `npm run test:e2e` | Запуск E2E-тестов |
| `npm run lint` | Линтинг кода |
| `npm run format` | Форматирование кода через Prettier |

---

## Документация API

После запуска сервера Swagger UI доступен по адресу:

```
http://localhost:3000/api/docs
```

### Базовый URL

```
http://localhost:3000/api/v1
```

### Основные эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/register` | Регистрация пользователя |
| `POST` | `/auth/login` | Вход в систему |
| `POST` | `/auth/refresh` | Обновление access-токена |
| `POST` | `/auth/logout` | Выход из системы |
| `GET` | `/auth/me` | Текущий пользователь |
| `GET` | `/polls` | Список публичных опросов |
| `POST` | `/polls` | Создать опрос |
| `GET` | `/polls/:slug` | Получить опрос |
| `PATCH` | `/polls/:slug` | Обновить опрос |
| `DELETE` | `/polls/:slug` | Удалить опрос |
| `GET` | `/polls/my` | Мои опросы |
| `PUT` | `/polls/:slug/questions` | Заменить вопросы |
| `POST` | `/polls/:slug/responses` | Отправить ответ |
| `GET` | `/polls/:slug/responses` | Получить ответы |
| `GET` | `/polls/:slug/analytics` | Аналитика опроса |
| `GET` | `/polls/:slug/analytics/export` | Экспорт в CSV |
| `GET` | `/admin/users` | Список пользователей (admin) |
| `PATCH` | `/admin/users/:id` | Изменить роль (admin) |
| `GET` | `/admin/polls` | Все опросы (admin) |

---

## Структура проекта

```
backend/
├── src/
│   ├── auth/           # Аутентификация (JWT, стратегии, гарды)
│   ├── users/          # Управление пользователями
│   ├── polls/          # CRUD опросов
│   ├── questions/      # Управление вопросами
│   ├── responses/      # Отправка и получение ответов
│   ├── analytics/      # Аналитика и CSV-экспорт
│   ├── admin/          # Административные эндпоинты
│   ├── common/         # Фильтры, декораторы, утилиты
│   ├── prisma/         # PrismaService и PrismaModule
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma   # Схема базы данных
│   └── migrations/
├── test/               # E2E-тесты
├── .env.example
├── Dockerfile
└── package.json
```

---

## Тесты

### Unit-тесты

```bash
npm test
```

Покрывают все сервисы (`AuthService`, `PollsService`, `ResponsesService`, `AnalyticsService`, `UsersService`) и утилиты (`generateSlug`, `getPaginationParams`). Все тесты используют моки — база данных не требуется.

### E2E-тесты

Требуют запущенной базы данных:

```bash
npm run test:e2e
```

### Покрытие кода

```bash
npm run test:cov
```

Отчёт сохраняется в папку `coverage/`.

---

## Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://user:pass@localhost:5432/polls` |
| `JWT_ACCESS_SECRET` | Секрет для подписи access-токенов | `change_me_access` |
| `JWT_REFRESH_SECRET` | Секрет для подписи refresh-токенов | `change_me_refresh` |
| `JWT_ACCESS_EXPIRES_IN` | TTL access-токена | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh-токена | `7d` |
| `FRONTEND_URL` | URL фронтенда для CORS | `http://localhost:5173` |
| `PORT` | Порт сервера | `3000` |
