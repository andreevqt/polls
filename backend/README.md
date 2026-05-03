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

- Node.js >= 20 (см. `.nvmrc`)
- npm >= 10
- PostgreSQL 16 (локально или через Docker)

---

## Быстрый старт

### 1. Установить зависимости

Из корня монорепо (рекомендуется):

```bash
npm install
```

Или напрямую из директории бэкенда:

```bash
cd backend && npm install
```

### 2. Настроить переменные окружения

```bash
cp backend/.env.example backend/.env
```

Отредактировать `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/polls
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=3000
```

> ⚠️ Никогда не коммитьте `.env` в репозиторий. Файл добавлен в `.gitignore`.

### 3. Запустить PostgreSQL

Если PostgreSQL не установлен локально, поднять через Docker:

```bash
docker run -d \
  --name polls-postgres \
  -e POSTGRES_DB=polls \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16-alpine
```

Или через Docker Compose из корня монорепо (только БД):

```bash
docker-compose up postgres -d
```

### 4. Применить миграции

```bash
cd backend
npx prisma migrate deploy
```

### 5. Запустить сервер

```bash
# из корня монорепо
npm run start:dev

# или напрямую
cd backend && npm run start:dev
```

Сервер запустится на `http://localhost:3000`.
Swagger UI: `http://localhost:3000/api/docs`

---

## Миграции базы данных

Все команды Prisma выполняются из директории `backend/`.

### Применить существующие миграции

Используется в CI и продакшне — применяет только уже созданные миграции без изменения схемы:

```bash
npx prisma migrate deploy
```

### Создать новую миграцию (разработка)

После изменения `prisma/schema.prisma` создать и применить миграцию:

```bash
npx prisma migrate dev --name <название_миграции>
```

Примеры названий: `add_user_avatar`, `add_poll_tags`, `rename_response_field`.

Команда:
1. Сравнивает текущую схему с состоянием БД
2. Генерирует SQL-файл миграции в `prisma/migrations/`
3. Применяет миграцию к локальной БД
4. Перегенерирует Prisma Client

### Просмотр статуса миграций

```bash
npx prisma migrate status
```

Показывает какие миграции применены, а какие ожидают применения.

### Сброс базы данных (только разработка!)

Удаляет все данные и применяет все миграции заново:

```bash
npx prisma migrate reset
```

> ⚠️ Никогда не используйте в продакшне — все данные будут удалены.

### Откат миграции

Prisma не поддерживает автоматический откат. Для отката:

1. Создать новую миграцию, которая отменяет изменения:
   ```bash
   npx prisma migrate dev --name revert_<название>
   ```
2. Вручную написать SQL в файле миграции

### Генерация Prisma Client

После изменения схемы без создания миграции (например, только добавили индекс):

```bash
npx prisma generate
```

### Просмотр данных в браузере (Prisma Studio)

Визуальный редактор базы данных:

```bash
npx prisma studio
```

Откроется на `http://localhost:5555`.

---

## Workflow разработки

### Типичный цикл при изменении схемы БД

```
1. Изменить prisma/schema.prisma
2. npx prisma migrate dev --name <описание_изменения>
3. Prisma Client автоматически перегенерируется
4. Обновить сервисы/DTO под новую схему
5. Запустить тесты: npm test
```

### Типичный цикл при добавлении нового эндпоинта

```
1. Создать/обновить DTO в src/<module>/dto/
2. Добавить метод в сервис src/<module>/<module>.service.ts
3. Добавить эндпоинт в контроллер src/<module>/<module>.controller.ts
4. Написать unit-тест в src/<module>/<module>.service.spec.ts
5. Добавить E2E-тест в test/app.e2e-spec.ts
6. Проверить типы: npm run check:ts
7. Запустить тесты: npm test && npm run test:e2e
```

### Отладка

Запуск с дебаггером (Node.js inspector на порту 9229):

```bash
cd backend && npm run start:debug
```

Подключиться через VS Code: `Run > Attach to Node Process`.

---

## Доступные скрипты

### Из корня монорепо

| Команда | Описание |
|---|---|
| `npm run start:dev` | Запуск бэкенда в режиме разработки |
| `npm test` | Запуск unit-тестов во всех воркспейсах |
| `npm run test:e2e` | Запуск E2E-тестов бэкенда |
| `npm run check:ts` | Проверка TypeScript во всех воркспейсах |
| `npm run lint` | Линтинг во всех воркспейсах |
| `npm run build` | Сборка всех воркспейсов |

### Из директории `backend/`

| Команда | Описание |
|---|---|
| `npm run start:dev` | Запуск в режиме разработки с hot-reload |
| `npm run start:prod` | Запуск собранного приложения |
| `npm run build` | Сборка TypeScript в `dist/` |
| `npm run check:ts` | Проверка типов TypeScript без компиляции |
| `npm test` | Запуск unit-тестов |
| `npm run test:watch` | Запуск тестов в watch-режиме |
| `npm run test:cov` | Запуск тестов с отчётом о покрытии |
| `npm run test:e2e` | Запуск E2E-тестов (требует БД) |
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

| Метод | Путь | Описание | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Регистрация пользователя | — |
| `POST` | `/auth/login` | Вход в систему | — |
| `POST` | `/auth/refresh` | Обновление access-токена | cookie |
| `POST` | `/auth/logout` | Выход из системы | Bearer |
| `GET` | `/auth/me` | Текущий пользователь | Bearer |
| `GET` | `/polls` | Список публичных опросов | — |
| `POST` | `/polls` | Создать опрос | Bearer |
| `GET` | `/polls/my` | Мои опросы | Bearer |
| `GET` | `/polls/:slug` | Получить опрос | optional |
| `PATCH` | `/polls/:slug` | Обновить опрос | Bearer (owner) |
| `DELETE` | `/polls/:slug` | Удалить опрос | Bearer (owner) |
| `PUT` | `/polls/:slug/questions` | Заменить вопросы | Bearer (owner) |
| `POST` | `/polls/:slug/responses` | Отправить ответ | optional |
| `GET` | `/polls/:slug/responses` | Получить ответы | Bearer (owner) |
| `GET` | `/polls/:slug/analytics` | Аналитика опроса | Bearer (owner) |
| `GET` | `/polls/:slug/analytics/export` | Экспорт в CSV | Bearer (owner) |
| `GET` | `/admin/users` | Список пользователей | Bearer (admin) |
| `PATCH` | `/admin/users/:id` | Изменить роль | Bearer (admin) |
| `GET` | `/admin/polls` | Все опросы | Bearer (admin) |

---

## Тесты

### Unit-тесты

```bash
# из корня монорепо
npm test

# или из backend/
cd backend && npm test
```

Покрывают все сервисы (`AuthService`, `PollsService`, `ResponsesService`, `AnalyticsService`, `UsersService`) и утилиты. Используют моки — база данных не требуется.

### E2E-тесты

Требуют запущенной базы данных:

```bash
# убедиться что БД запущена
docker-compose up postgres -d

# из корня монорепо
npm run test:e2e

# или из backend/
cd backend && npm run test:e2e
```

E2E-тесты покрывают полный цикл: регистрация → вход → создание опроса → отправка ответов → аналитика → удаление.

### Покрытие кода

```bash
cd backend && npm run test:cov
```

Отчёт сохраняется в `backend/coverage/`.

### Проверка типов TypeScript

```bash
# из корня монорепо
npm run check:ts

# или из backend/
cd backend && npm run check:ts
```

---

## Запуск через Docker Compose

Из корня монорепозитория запустить весь стек (PostgreSQL + backend):

```bash
docker-compose up --build
```

Только PostgreSQL (для локальной разработки):

```bash
docker-compose up postgres -d
```

---

## Структура проекта

```
backend/
├── src/
│   ├── auth/               # Аутентификация (JWT, стратегии, гарды)
│   │   ├── dto/            # RegisterDto, LoginDto
│   │   ├── guards/         # JwtAuthGuard, JwtRefreshGuard, OptionalJwtGuard
│   │   └── strategies/     # JwtStrategy, JwtRefreshStrategy
│   ├── users/              # Управление пользователями
│   ├── polls/              # CRUD опросов
│   │   ├── dto/            # CreatePollDto, UpdatePollDto, PollQueryDto
│   │   └── guards/         # PollOwnerGuard
│   ├── questions/          # Управление вопросами (ReplaceQuestionsDto)
│   ├── responses/          # Отправка и получение ответов
│   ├── analytics/          # Аналитика и CSV-экспорт
│   ├── admin/              # Административные эндпоинты
│   │   └── guards/         # AdminGuard
│   ├── common/
│   │   ├── decorators/     # @CurrentUser(), @Public()
│   │   ├── filters/        # HttpExceptionFilter
│   │   └── utils/          # generateSlug(), getPaginationParams()
│   ├── prisma/             # PrismaService и PrismaModule
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma       # Схема базы данных
│   └── migrations/         # SQL-миграции
├── test/
│   ├── app.e2e-spec.ts     # E2E-тесты
│   └── jest-e2e.json       # Конфигурация Jest для E2E
├── .env.example
├── Dockerfile
└── package.json
```

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
