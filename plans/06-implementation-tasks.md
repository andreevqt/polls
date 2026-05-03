# Polls App — Задачи реализации

Этот документ содержит упорядоченный список задач реализации, предназначенных для делегирования отдельным разработчикам или AI-моделям. Каждая задача самодостаточна: содержит чёткие входные данные, ожидаемый результат и ссылки на спецификации.

---

## Фаза 1: Инициализация проекта

### ЗАДАЧА-01: Инициализация структуры монорепозитория
**Ссылки:** [`plans/00-overview.md`](00-overview.md), [`plans/05-backend-spec.md`](05-backend-spec.md)

**Инструкции:**
1. Создать корневой `docker-compose.yml` согласно `05-backend-spec.md`
2. Создать NestJS бэкенд: `npx @nestjs/cli new backend --package-manager npm`
3. Создать React фронтенд: `npm create vite@latest frontend -- --template react-ts`
4. Создать корневой `.gitignore` для `node_modules`, `dist`, `.env`, `*.local`

**Результат:** Рабочий монорепозиторий с `backend/`, `frontend/`, `docker-compose.yml`

---

### ЗАДАЧА-02: Настройка зависимостей бэкенда и Prisma
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md), [`plans/02-data-models.md`](02-data-models.md)

**Инструкции:**
1. Установить зависимости бэкенда:
   ```
   npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger @nestjs/throttler
   npm install passport passport-jwt bcrypt nanoid csv-stringify
   npm install prisma @prisma/client
   npm install -D @types/bcrypt @types/passport-jwt
   ```
2. Выполнить `npx prisma init`
3. Скопировать полную Prisma-схему из `02-data-models.md` в `prisma/schema.prisma`
4. Создать `.env` и `.env.example` с переменными из `05-backend-spec.md`
5. Выполнить `npx prisma migrate dev --name init`

**Результат:** Бэкенд с настроенной Prisma, применённой начальной миграцией, созданной схемой БД

---

### ЗАДАЧА-03: Настройка зависимостей фронтенда
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md)

**Инструкции:**
1. Установить зависимости фронтенда:
   ```
   npm install axios react-router-dom zustand @tanstack/react-query
   npm install react-hook-form zod @hookform/resolvers
   npm install recharts react-hot-toast
   npm install -D tailwindcss postcss autoprefixer
   ```
2. Инициализировать Tailwind: `npx tailwindcss init -p`
3. Настроить пути content в `tailwind.config.ts`
4. Добавить директивы Tailwind в `src/index.css`
5. Настроить `vite.config.ts` с прокси: `/api` → `http://localhost:3000`

**Результат:** Фронтенд со всеми установленными зависимостями и настроенным Tailwind

---

## Фаза 2: Ядро бэкенда

### ЗАДАЧА-04: Реализация PrismaModule и PrismaService
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «PrismaService»

**Инструкции:**
1. Создать `src/prisma/prisma.service.ts`, расширяющий `PrismaClient`, реализующий `OnModuleInit` и `OnModuleDestroy`
2. Создать `src/prisma/prisma.module.ts` как `@Global()` модуль, экспортирующий `PrismaService`
3. Импортировать `PrismaModule` в `AppModule`

**Результат:** `PrismaModule` доступен глобально во всех NestJS-модулях

---

### ЗАДАЧА-05: Реализация AuthModule — Регистрация и Вход
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «AuthModule», [`plans/03-api-spec.md`](03-api-spec.md) — эндпоинты Auth

**Инструкции:**
1. Создать `RegisterDto` и `LoginDto` с декораторами `class-validator`
2. Реализовать `AuthService.register()`: хешировать пароль bcrypt (rounds=12), создать пользователя, вызвать `generateTokens()`
3. Реализовать `AuthService.login()`: найти пользователя по email, сравнить пароль, вызвать `generateTokens()`
4. Реализовать `AuthService.generateTokens()`: подписать access-токен (15м) и refresh-токен (7д) через `@nestjs/jwt`
5. Реализовать `AuthService.storeRefreshToken()`: хешировать refresh-токен bcrypt, сделать upsert в таблицу `refresh_tokens`
6. Создать `AuthController` с `POST /auth/register` и `POST /auth/login`
7. Установить refresh-токен как httpOnly cookie в ответе
8. Инициализировать `main.ts` согласно `05-backend-spec.md`

**Результат:** Рабочие эндпоинты регистрации и входа, возвращающие JWT-токены

---

### ЗАДАЧА-06: Реализация AuthModule — JWT-гарды и стратегии
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «JwtStrategy»

**Инструкции:**
1. Реализовать `JwtStrategy`, извлекающий Bearer-токен из заголовка, возвращающий `{ id, role }`
2. Реализовать `JwtRefreshStrategy`, извлекающий токен из cookie `refresh_token`
3. Реализовать `JwtAuthGuard`, расширяющий `AuthGuard('jwt')`
4. Реализовать `OptionalJwtAuthGuard` — переопределяет `handleRequest`, возвращает `null` вместо ошибки при отсутствии токена
5. Создать param-декоратор `@CurrentUser()`
6. Создать декоратор `@Public()` для пропуска auth-гарда на конкретных маршрутах

**Результат:** Гарды и стратегии готовы для защиты маршрутов

---

### ЗАДАЧА-07: Реализация AuthModule — Обновление токена и Выход
**Ссылки:** [`plans/03-api-spec.md`](03-api-spec.md) — `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`

**Инструкции:**
1. Реализовать `AuthService.refresh()`: валидировать сохранённый хеш, ротировать refresh-токен (удалить старый, сохранить новый)
2. Реализовать `AuthService.logout()`: удалить refresh-токен из БД, очистить cookie
3. Добавить эндпоинт `POST /auth/refresh` с использованием `JwtRefreshGuard`
4. Добавить эндпоинт `POST /auth/logout`
5. Добавить эндпоинт `GET /auth/me` с использованием `JwtAuthGuard`

**Результат:** Полный auth-флоу работает end-to-end

---

### ЗАДАЧА-08: Реализация PollsModule — CRUD
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «PollsModule», [`plans/03-api-spec.md`](03-api-spec.md) — эндпоинты Polls

**Инструкции:**
1. Создать `CreatePollDto`, `UpdatePollDto`, `PollQueryDto` с валидацией
2. Реализовать `PollsService.create()`: генерировать slug через утилиту `generateSlug()`, создать опрос + вопросы + варианты в одной Prisma-транзакции
3. Реализовать `PollsService.findAll()`: пагинированный запрос с фильтром `search` по названию, только `PUBLIC` + `isActive=true` + не истёкшие
4. Реализовать `PollsService.findBySlug()`: включить вопросы и варианты; валидировать приватный access-токен если `visibility=PRIVATE`
5. Реализовать `PollsService.update()`: частичное обновление метаданных опроса
6. Реализовать `PollsService.delete()`: каскадное удаление (Prisma обрабатывает через схему)
7. Реализовать `PollOwnerGuard`
8. Создать `PollsController` со всеми эндпоинтами из `03-api-spec.md`

**Результат:** Полный CRUD опросов с проверкой владельца

---

### ЗАДАЧА-09: Реализация QuestionsModule — Замена вопросов
**Ссылки:** [`plans/03-api-spec.md`](03-api-spec.md) — `PUT /polls/:slug/questions`, [`plans/05-backend-spec.md`](05-backend-spec.md)

**Инструкции:**
1. Создать `ReplaceQuestionsDto` с вложенными DTO для вопросов и вариантов
2. Реализовать `QuestionsService.replaceAll()`:
   - Удалить все существующие вопросы опроса (каскадно удаляет варианты/ответы)
   - Пересоздать вопросы и варианты из DTO в транзакции
   - Сохранять существующие ID где указаны, чтобы не сломать существующие ответы
3. Добавить `PUT /polls/:slug/questions` в `PollsController`

**Результат:** Редактор опроса может сохранять изменения вопросов

---

### ЗАДАЧА-10: Реализация ResponsesModule
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «ResponsesModule», [`plans/03-api-spec.md`](03-api-spec.md) — эндпоинты Responses

**Инструкции:**
1. Создать `SubmitResponseDto` с вложенным `SubmitAnswerDto`
2. Реализовать `ResponsesService.submit()`:
   - Валидировать активность опроса и срок действия
   - Валидировать доступ к приватному опросу
   - Проверить дедупликацию (уникальное ограничение userId, мягкая проверка fingerprint)
   - Валидировать, что все обязательные вопросы отвечены
   - Валидировать соответствие типов ответов типам вопросов
   - Создать response + answers в транзакции
3. Реализовать `ResponsesService.findByPoll()`: пагинированные ответы с информацией о пользователе и answers
4. Создать `ResponsesController` с эндпоинтами `POST` и `GET`

**Результат:** Пользователи могут отправлять ответы; дубликаты предотвращаются

---

### ЗАДАЧА-11: Реализация AnalyticsModule
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «AnalyticsModule», [`plans/03-api-spec.md`](03-api-spec.md) — эндпоинты Analytics

**Инструкции:**
1. Реализовать `AnalyticsService.getAnalytics()`:
   - Общее количество ответов
   - Ответы по дате: использовать `$queryRaw` с `DATE_TRUNC('day', submitted_at)`
   - По вопросу: для вопросов с выбором — количество по варианту с процентом; для текстовых — собрать текстовые значения
2. Реализовать `AnalyticsService.exportCsv()`:
   - Построить строку заголовков из текстов вопросов
   - Стримить строки через `csv-stringify`, направленный в `@Res() res: Response`
   - Установить заголовки: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="..."`
3. Создать `AnalyticsController` с `GET /polls/:slug/analytics` и `GET /polls/:slug/analytics/export`

**Результат:** Данные аналитики доступны; экспорт CSV работает

---

### ЗАДАЧА-12: Реализация AdminModule
**Ссылки:** [`plans/03-api-spec.md`](03-api-spec.md) — эндпоинты Admin, [`plans/05-backend-spec.md`](05-backend-spec.md)

**Инструкции:**
1. Реализовать `AdminGuard`, проверяющий `req.user.role === 'ADMIN'`
2. Создать `AdminController` с:
   - `GET /admin/users` — пагинированный список пользователей
   - `PATCH /admin/users/:id` — обновление роли
   - `GET /admin/polls` — все опросы независимо от видимости
3. Добавить `DELETE /admin/polls/:id`, делегирующий в `PollsService.delete()`

**Результат:** Администратор может управлять пользователями и всеми опросами

---

### ЗАДАЧА-13: Реализация глобального фильтра исключений и throttler
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел «common/filters», [`plans/03-api-spec.md`](03-api-spec.md) — Формат ответа об ошибке

**Инструкции:**
1. Создать `HttpExceptionFilter`, реализующий `ExceptionFilter`, форматирующий все ошибки как:
   ```json
   { "statusCode", "message", "errors", "timestamp", "path" }
   ```
2. Настроить `ThrottlerModule` в `AppModule`: `ttl: 60, limit: 10` для auth-маршрутов
3. Применить `ThrottlerGuard` к `AuthController`

**Результат:** Единообразные ответы об ошибках; rate limiting на auth

---

## Фаза 3: Ядро фронтенда

### ЗАДАЧА-14: Реализация Axios-клиента с интерцепторами
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — раздел «Axios-интерцепторы»

**Инструкции:**
1. Создать `src/api/client.ts`:
   - Axios-инстанс с `baseURL: import.meta.env.VITE_API_BASE_URL`
   - Интерцептор запроса: добавлять `accessToken` из Zustand-стора
   - Интерцептор ответа: при 401 вызывать `POST /auth/refresh`, обновлять стор, повторять исходный запрос
   - Если refresh не удался: вызвать `clearAuth()`, редирект на `/login`
2. Создать `src/store/authStore.ts` с Zustand-стором согласно `04-frontend-spec.md`

**Результат:** Все API-вызовы автоматически включают auth-токен; тихое обновление токена работает

---

### ЗАДАЧА-15: Реализация TypeScript-типов и API-функций
**Ссылки:** [`plans/03-api-spec.md`](03-api-spec.md), [`plans/04-frontend-spec.md`](04-frontend-spec.md) — раздел «types/»

**Инструкции:**
1. Создать `src/types/user.ts`, `src/types/poll.ts`, `src/types/analytics.ts`, соответствующие всем формам ответов API
2. Создать `src/api/auth.ts`: `register()`, `login()`, `logout()`, `refresh()`, `getMe()`
3. Создать `src/api/polls.ts`: `getPolls()`, `getPoll()`, `createPoll()`, `updatePoll()`, `deletePoll()`, `replaceQuestions()`, `regenerateToken()`
4. Создать `src/api/responses.ts`: `submitResponse()`, `getResponses()`
5. Создать `src/api/analytics.ts`: `getAnalytics()`, `exportCsv()`

**Результат:** Типизированный API-слой готов к использованию в компонентах

---

### ЗАДАЧА-16: Реализация маршрутизации и компонентов макета
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — разделы «Маршрутизация» и «Компоненты»

**Инструкции:**
1. Создать `src/router.tsx` со всеми маршрутами согласно спецификации
2. Реализовать компонент `ProtectedRoute`: проверяет `authStore.user`, редиректит на `/login` если null; при монтировании вызывает `GET /auth/me` для восстановления сессии
3. Реализовать компонент `AdminRoute`: расширяет `ProtectedRoute`, проверяет `user.role === 'ADMIN'`
4. Создать `src/components/layout/Header.tsx`: логотип, навигационные ссылки, меню пользователя (вход/регистрация или имя пользователя + выход)
5. Создать `src/components/layout/PageWrapper.tsx`: единообразные отступы и максимальная ширина страницы

**Результат:** Маршрутизация приложения работает; защищённые маршруты перенаправляют неавторизованных пользователей

---

### ЗАДАЧА-17: Реализация страниц авторизации
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — LoginPage, RegisterPage

**Инструкции:**
1. Создать переиспользуемые UI-примитивы: `Button`, `Input`, `FormField` (label + input + сообщение об ошибке)
2. Реализовать `LoginPage`: React Hook Form + Zod-схема `{ email: z.string().email(), password: z.string().min(8) }`, вызов API `login()`, обновление Zustand-стора, редирект на `/dashboard`
3. Реализовать `RegisterPage`: аналогичный паттерн с полями имени и подтверждения пароля
4. Показывать toast-уведомления при ошибках

**Результат:** Пользователи могут регистрироваться и входить в систему

---

### ЗАДАЧА-18: Реализация LandingPage и PollCard
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — LandingPage, PollCard

**Инструкции:**
1. Реализовать компонент `PollCard`: название, владелец, количество ответов, бейдж дедлайна, бейдж видимости, кнопка-ссылка «Пройти опрос»
2. Реализовать `LandingPage`:
   - Hero-секция с кнопками CTA
   - Поле поиска (debounce 300мс через хук `useDebounce`)
   - Сетка компонентов `PollCard` через React Query `useQuery(['polls', { search, page }])`
   - Элементы управления пагинацией

**Результат:** Лендинг показывает публичные опросы с поиском

---

### ЗАДАЧА-19: Реализация DashboardPage
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — DashboardPage

**Инструкции:**
1. Реализовать `DashboardPage` с React Query для получения опросов пользователя (добавить эндпоинт `GET /polls/my` на бэкенде если отсутствует, или фильтровать по `ownerId=me()`)
2. Отобразить опросы в таблице с колонками: Название, Видимость, Ответы, Дедлайн, Статус (Активен/Истёк/Неактивен)
3. Кнопки действий в каждой строке: «Редактировать» → `/polls/:slug/edit`, «Результаты» → `/polls/:slug/results`, «Скопировать ссылку» (копирует URL в буфер с toast), «Удалить» (диалог подтверждения → `deletePoll()` → инвалидация запроса)
4. Кнопка «Создать новый опрос» вверху

**Результат:** Дашборд показывает опросы пользователя с действиями управления

---

### ЗАДАЧА-20: Реализация PollBuilderPage
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — PollBuilderPage (самая сложная)

**Инструкции:**
1. Реализовать компонент `QuestionBuilder`: поле текста, выбор типа (`SINGLE_CHOICE` / `MULTIPLE_CHOICE` / `TEXT`), список вариантов (добавить/удалить/переупорядочить), переключатель «Обязательный», кнопка удаления
2. Реализовать `PollBuilderPage` с `useReducer` для состояния списка вопросов:
   - Действия: `ADD_QUESTION`, `UPDATE_QUESTION`, `DELETE_QUESTION`, `REORDER_QUESTIONS`, `ADD_OPTION`, `UPDATE_OPTION`, `DELETE_OPTION`
3. Панель настроек опроса: название (с предпросмотром slug в реальном времени), описание, переключатель видимости, выбор даты дедлайна
4. При сохранении (новый): вызвать `createPoll()`, редирект на `/polls/:slug/edit`
5. При сохранении (редактирование): вызвать `updatePoll()` + `replaceQuestions()` последовательно
6. Валидация: минимум 1 вопрос; вопросы с выбором требуют ≥2 вариантов; показывать inline-ошибки

**Результат:** Пользователи могут создавать и редактировать опросы с несколькими типами вопросов

---

### ЗАДАЧА-21: Реализация TakePollPage
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — TakePollPage

**Инструкции:**
1. Реализовать компонент `AnswerInput`:
   - `SINGLE_CHOICE`: группа радиокнопок
   - `MULTIPLE_CHOICE`: группа чекбоксов
   - `TEXT`: textarea
2. Реализовать `TakePollPage`:
   - Получить опрос по slug (передать query-параметр `accessToken` если присутствует в URL)
   - Отрендерить вопросы с компонентами `AnswerInput`
   - Прогресс-бар: `(отвеченные вопросы / всего обязательных вопросов) * 100`
   - Кнопка «Отправить» вызывает `submitResponse()`
   - Обработать ошибки: 409 «Уже отвечали», 410 «Опрос истёк», 403 «Нет доступа»
   - При успехе: показать экран «Спасибо» с количеством ответов и ссылкой на результаты

**Результат:** Пользователи могут проходить опросы; ошибки обрабатываются корректно

---

### ЗАДАЧА-22: Реализация PollResultsPage с графиками
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — PollResultsPage

**Инструкции:**
1. Реализовать компонент `ResultChart`:
   - Для `SINGLE_CHOICE` / `MULTIPLE_CHOICE`: Recharts `BarChart` с текстом варианта по оси X, количеством по оси Y; процент в tooltip
   - Для `TEXT`: прокручиваемый список текстовых ответов в карточке
2. Реализовать `PollResultsPage`:
   - Карточка сводки: всего ответов, название опроса, кнопка поделиться ссылкой
   - Recharts `LineChart` для ответов по времени (X: дата, Y: количество)
   - Список `ResultChart` для каждого вопроса
   - Кнопка «Экспорт CSV»: вызывает `exportCsv()`, инициирует скачивание в браузере
3. Использовать React Query с ключом `['analytics', slug]`

**Результат:** Владельцы опросов могут просматривать аналитику с графиками и экспортировать данные

---

### ЗАДАЧА-23: Реализация AdminPage
**Ссылки:** [`plans/04-frontend-spec.md`](04-frontend-spec.md) — AdminPage

**Инструкции:**
1. Реализовать `AdminPage` с двумя вкладками через стилизацию Tailwind
2. Вкладка пользователей: таблица с именем, email, ролью, датой создания; выпадающий список роли в каждой строке, вызывающий `PATCH /admin/users/:id`
3. Вкладка опросов: таблица всех опросов (название, владелец, видимость, ответы, создан); кнопка удаления в каждой строке
4. Пагинация обеих таблиц

**Результат:** Администраторы могут управлять пользователями и опросами

---

## Фаза 4: Интеграция и полировка

### ЗАДАЧА-24: Добавление эндпоинта `GET /polls/my` на бэкенде
**Ссылки:** [`plans/03-api-spec.md`](03-api-spec.md)

**Инструкции:**
1. Добавить `GET /polls/my` в `PollsController` (требует авторизации)
2. `PollsService.findByOwner(userId, query)`: пагинированные опросы текущего пользователя, включая количество ответов
3. Возвращать ту же форму что и `GET /polls`, но без фильтра видимости

**Результат:** Дашборд может получать собственные опросы пользователя

---

### ЗАДАЧА-25: Написание E2E-тестов бэкенда для критических путей
**Ссылки:** [`plans/03-api-spec.md`](03-api-spec.md)

**Инструкции:**
Используя NestJS `@nestjs/testing` + `supertest`:
1. Auth-флоу: регистрация → вход → обновление токена → выход
2. Жизненный цикл опроса: создание → получение → обновление → удаление
3. Отправка ответа: отправить → проверка дубликата → проверка истёкшего опроса
4. Аналитика: отправить 3 ответа → получить аналитику → проверить количество

**Результат:** E2E-тест-сьют покрывает критические пути

---

### ЗАДАЧА-26: Написание Dockerfile и финализация docker-compose
**Ссылки:** [`plans/05-backend-spec.md`](05-backend-spec.md) — раздел Docker

**Инструкции:**
1. Создать `backend/Dockerfile` согласно спецификации (многоэтапная сборка)
2. Создать `frontend/Dockerfile`:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   ```
3. Создать `frontend/nginx.conf` с fallback для SPA (`try_files $uri /index.html`)
4. Финализировать `docker-compose.yml` с health check для postgres

**Результат:** Полное приложение запускается через `docker-compose up`

---

## Сводная таблица задач

| Задача | Фаза | Модуль | Сложность |
|---|---|---|---|
| ЗАДАЧА-01 | Инициализация | Инфра | Низкая |
| ЗАДАЧА-02 | Инициализация | Бэкенд | Низкая |
| ЗАДАЧА-03 | Инициализация | Фронтенд | Низкая |
| ЗАДАЧА-04 | Ядро бэкенда | Prisma | Низкая |
| ЗАДАЧА-05 | Ядро бэкенда | Auth | Средняя |
| ЗАДАЧА-06 | Ядро бэкенда | Auth | Средняя |
| ЗАДАЧА-07 | Ядро бэкенда | Auth | Средняя |
| ЗАДАЧА-08 | Ядро бэкенда | Polls | Высокая |
| ЗАДАЧА-09 | Ядро бэкенда | Questions | Средняя |
| ЗАДАЧА-10 | Ядро бэкенда | Responses | Высокая |
| ЗАДАЧА-11 | Ядро бэкенда | Analytics | Высокая |
| ЗАДАЧА-12 | Ядро бэкенда | Admin | Низкая |
| ЗАДАЧА-13 | Ядро бэкенда | Common | Низкая |
| ЗАДАЧА-14 | Ядро фронтенда | API-клиент | Средняя |
| ЗАДАЧА-15 | Ядро фронтенда | Типы/API | Средняя |
| ЗАДАЧА-16 | Ядро фронтенда | Маршрутизация | Средняя |
| ЗАДАЧА-17 | Ядро фронтенда | Страницы Auth | Средняя |
| ЗАДАЧА-18 | Ядро фронтенда | Лендинг | Средняя |
| ЗАДАЧА-19 | Ядро фронтенда | Дашборд | Средняя |
| ЗАДАЧА-20 | Ядро фронтенда | Конструктор опроса | Высокая |
| ЗАДАЧА-21 | Ядро фронтенда | Прохождение опроса | Средняя |
| ЗАДАЧА-22 | Ядро фронтенда | Результаты | Высокая |
| ЗАДАЧА-23 | Ядро фронтенда | Admin | Средняя |
| ЗАДАЧА-24 | Интеграция | Бэкенд | Низкая |
| ЗАДАЧА-25 | Интеграция | Тесты | Средняя |
| ЗАДАЧА-26 | Интеграция | Docker | Низкая |
