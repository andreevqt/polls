# Polls App — Системная архитектура

## Высокоуровневая архитектура

```mermaid
graph TB
    subgraph Клиент
        Browser[Браузер / React SPA]
    end

    subgraph Backend [NestJS Бэкенд :3000]
        AuthModule[Модуль Auth]
        PollsModule[Модуль Polls]
        QuestionsModule[Модуль Questions]
        ResponsesModule[Модуль Responses]
        AnalyticsModule[Модуль Analytics]
        UsersModule[Модуль Users]
    end

    subgraph Data [Данные]
        PG[(PostgreSQL)]
        Prisma[Prisma ORM]
    end

    Browser -->|REST + JWT| AuthModule
    Browser -->|REST + JWT| PollsModule
    Browser -->|REST + JWT| ResponsesModule
    Browser -->|REST + JWT| AnalyticsModule

    AuthModule --> Prisma
    PollsModule --> Prisma
    QuestionsModule --> Prisma
    ResponsesModule --> Prisma
    AnalyticsModule --> Prisma
    UsersModule --> Prisma

    Prisma --> PG
```

## Поток запроса

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant FE as React Фронтенд
    participant BE as NestJS API
    participant DB as PostgreSQL

    U->>FE: Открывает приложение
    FE->>BE: POST /auth/login
    BE->>DB: SELECT user WHERE email=...
    DB-->>BE: строка пользователя
    BE-->>FE: access_token + refresh_token
    FE->>FE: Сохраняет токены в памяти / httpOnly cookie

    U->>FE: Создаёт опрос
    FE->>BE: POST /polls  Authorization: Bearer token
    BE->>BE: JwtAuthGuard проверяет токен
    BE->>DB: INSERT poll + questions + options
    DB-->>BE: созданный опрос
    BE-->>FE: объект опроса
    FE-->>U: Редирект в редактор опроса
```

## Описание компонентов

### Модули бэкенда

| Модуль | Ответственность |
|---|---|
| `AuthModule` | Регистрация, вход, обновление токена, выход |
| `UsersModule` | CRUD пользователей, управление ролями |
| `PollsModule` | CRUD опросов, генерация slug, видимость |
| `QuestionsModule` | CRUD вопросов и вариантов ответов (вложено в опросы) |
| `ResponsesModule` | Отправка и получение ответов |
| `AnalyticsModule` | Агрегированная статистика, экспорт CSV |

### Страницы фронтенда

| Маршрут | Страница | Требует авторизации |
|---|---|---|
| `/` | Лендинг / лента публичных опросов | Нет |
| `/login` | Форма входа | Нет |
| `/register` | Форма регистрации | Нет |
| `/dashboard` | Список моих опросов | Да |
| `/polls/new` | Конструктор опроса | Да |
| `/polls/:slug/edit` | Редактирование опроса | Да (владелец) |
| `/polls/:slug` | Прохождение опроса | Нет (публичный) / Ссылка (приватный) |
| `/polls/:slug/results` | Страница аналитики | Да (владелец) |
| `/admin` | Панель администратора | Да (admin) |

## Инфраструктура

```mermaid
graph LR
    subgraph Docker Compose
        FE_Container[frontend :5173]
        BE_Container[backend :3000]
        DB_Container[postgres :5432]
    end

    FE_Container -->|HTTP| BE_Container
    BE_Container -->|TCP| DB_Container
```

### Сервисы Docker Compose

| Сервис | Образ | Порт |
|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 |
| `backend` | Кастомный Dockerfile | 3000 |
| `frontend` | Кастомный Dockerfile | 5173 |

## Безопасность

- Пароли хешируются через `bcrypt` (rounds: 12)
- TTL access-токена: 15 минут
- TTL refresh-токена: 7 дней, хранится в httpOnly cookie
- Приватные опросы доступны только по секретной ссылке (UUID-токен в URL)
- Rate limiting на эндпоинтах аутентификации (10 запросов/мин с одного IP)
- Валидация входных данных через `class-validator` на всех DTO
- CORS настроен только на origin фронтенда
