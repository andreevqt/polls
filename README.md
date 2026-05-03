# Polls — Система опросов

Веб-приложение для создания опросов, голосования и отображения результатов в реальном времени. Компании и команды могут проводить голосования, а участники сразу видят результаты на графиках.

---

## Возможности

- **Создание опросов** — конструктор с поддержкой одиночного выбора, множественного выбора и текстовых ответов
- **Голосование** — прохождение опросов авторизованными и анонимными пользователями
- **Визуализация результатов** — столбчатые и круговые графики, динамика ответов по времени
- **Публичные и приватные опросы** — доступ по ссылке с уникальным токеном
- **Дедлайны** — автоматическое закрытие опроса по истечении срока
- **Анализ ответов** — агрегированная статистика, экспорт в CSV
- **Анонимные опросы** — участие без регистрации
- **Панель администратора** — управление пользователями и всеми опросами

---

## Технологический стек

| Слой | Технология |
|---|---|
| Фронтенд | React 18 + TypeScript + Vite |
| Стилизация | Tailwind CSS |
| Графики | Recharts |
| Бэкенд | Node.js + NestJS |
| База данных | PostgreSQL 16 |
| ORM | Prisma |
| Аутентификация | JWT (access + refresh токены) |
| Контейнеризация | Docker + Docker Compose |

---

## Быстрый старт

### Требования
- [Docker](https://www.docker.com/) и Docker Compose
- Node.js 20+ (для локальной разработки без Docker)

### Запуск через Docker Compose

```bash
# Клонировать репозиторий
git clone <repo-url>
cd polls

# Запустить все сервисы
docker-compose up --build
```

После запуска:
- Фронтенд: [http://localhost:5173](http://localhost:5173)
- Бэкенд API: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- Swagger-документация: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Локальная разработка

**Бэкенд:**
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev
```

**Фронтенд:**
```bash
cd frontend
npm install
npm run dev
```

---

## Структура проекта

```
polls/
├── backend/                # NestJS приложение
│   ├── src/
│   │   ├── auth/           # Аутентификация и авторизация
│   │   ├── polls/          # CRUD опросов
│   │   ├── questions/      # Управление вопросами
│   │   ├── responses/      # Отправка и хранение ответов
│   │   ├── analytics/      # Аналитика и экспорт CSV
│   │   ├── admin/          # Панель администратора
│   │   └── prisma/         # Сервис базы данных
│   └── prisma/
│       └── schema.prisma   # Схема базы данных
├── frontend/               # React + Vite приложение
│   └── src/
│       ├── api/            # API-клиент и функции
│       ├── components/     # UI-компоненты
│       ├── pages/          # Страницы приложения
│       ├── store/          # Zustand-стор (auth)
│       └── types/          # TypeScript-типы
├── plans/                  # Архитектурные спецификации
└── docker-compose.yml
```

---

## Страницы приложения

| Маршрут | Описание |
|---|---|
| `/` | Лендинг с лентой публичных опросов |
| `/register` | Регистрация |
| `/login` | Вход |
| `/dashboard` | Мои опросы |
| `/polls/new` | Создание опроса |
| `/polls/:slug/edit` | Редактирование опроса |
| `/polls/:slug` | Прохождение опроса |
| `/polls/:slug/results` | Аналитика и результаты |
| `/admin` | Панель администратора |

---

## API

Базовый URL: `http://localhost:3000/api/v1`

Полная документация доступна в Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

Основные группы эндпоинтов:

| Группа | Эндпоинты |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Polls | `GET /polls`, `POST /polls`, `GET /polls/:slug`, `PATCH /polls/:slug`, `DELETE /polls/:slug` |
| Questions | `PUT /polls/:slug/questions` |
| Responses | `POST /polls/:slug/responses`, `GET /polls/:slug/responses` |
| Analytics | `GET /polls/:slug/analytics`, `GET /polls/:slug/analytics/export` |
| Admin | `GET /admin/users`, `PATCH /admin/users/:id`, `GET /admin/polls` |

---

## Схема базы данных

```
User ──< Poll ──< Question ──< Option
              └──< Response ──< Answer >──┘
```

- **User** — пользователи с ролями `USER` / `ADMIN`
- **Poll** — опросы с настройками видимости и дедлайном
- **Question** — вопросы трёх типов: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TEXT`
- **Response** — один ответ на опрос от пользователя
- **Answer** — ответ на конкретный вопрос (вариант или текст)

---

## Безопасность

- Пароли хешируются через `bcrypt` (12 раундов)
- JWT access-токен живёт 15 минут, хранится в памяти
- JWT refresh-токен живёт 7 дней, хранится в `httpOnly` cookie
- Приватные опросы доступны только по секретной ссылке
- Rate limiting на эндпоинтах аутентификации (10 запросов/мин)

---

## Переменные окружения

### Бэкенд (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/polls
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Фронтенд (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Документация

Подробные спецификации находятся в папке [`plans/`](plans/):

| Файл | Описание |
|---|---|
| [`plans/00-overview.md`](plans/00-overview.md) | Обзор проекта и технологический стек |
| [`plans/01-architecture.md`](plans/01-architecture.md) | Системная архитектура и диаграммы |
| [`plans/02-data-models.md`](plans/02-data-models.md) | Модели данных и Prisma-схема |
| [`plans/03-api-spec.md`](plans/03-api-spec.md) | Спецификация REST API |
| [`plans/04-frontend-spec.md`](plans/04-frontend-spec.md) | Спецификация фронтенда |
| [`plans/05-backend-spec.md`](plans/05-backend-spec.md) | Спецификация бэкенда |
| [`plans/06-implementation-tasks.md`](plans/06-implementation-tasks.md) | Задачи реализации |
| [`plans/AGENT-GUIDE.md`](plans/AGENT-GUIDE.md) | Руководство для агентов-имплементаторов |

---

## Пример использования

> Компания проводит голосование о бонусах. HR создаёт опрос с вариантами распределения бонусного фонда, рассылает приватную ссылку сотрудникам. Каждый сотрудник анонимно выбирает предпочтительный вариант. Результаты сразу отображаются на графике — руководство видит распределение голосов в реальном времени и принимает решение на основе данных.

---

## Лицензия

MIT
