# Polls Frontend

React-приложение для создания опросов и голосований. Включает публичный интерфейс, личный кабинет пользователя и полноценную административную панель.

## Технологический стек

- **Runtime:** Node.js 20 LTS
- **Сборщик:** Vite 5
- **UI:** React 18 + TypeScript
- **Стили:** Tailwind CSS 3
- **Роутинг:** React Router v7
- **Запросы к API:** TanStack React Query v5
- **Состояние:** Zustand (только accessToken в памяти)
- **Формы:** react-hook-form + Zod
- **Графики:** Recharts
- **HTTP-клиент:** Axios (с автоматическим refresh на 401)

---

## Требования

- Node.js >= 20 (см. `.nvmrc`)
- npm >= 10
- Запущенный бэкенд на `http://localhost:3000`

---

## Быстрый старт

### 1. Установить зависимости

```bash
cd frontend && npm install
```

### 2. Настроить переменные окружения

```bash
cp frontend/.env.example frontend/.env
```

Содержимое `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

> ⚠️ Никогда не коммитьте `.env` в репозиторий.

### 3. Запустить dev-сервер

```bash
cd frontend && npm run dev
```

Приложение откроется на `http://localhost:5173`.

---

## Доступные скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Запуск dev-сервера с HMR |
| `npm run build` | Сборка для продакшна (`tsc -b && vite build`) |
| `npm run preview` | Предпросмотр продакшн-сборки |
| `npm run check:ts` | Проверка типов TypeScript без компиляции |
| `npm run lint` | Линтинг кода через ESLint |
| `npm test` | Запуск unit-тестов (Vitest, однократно) |
| `npm run test:watch` | Запуск тестов в watch-режиме |
| `npm run test:coverage` | Запуск тестов с отчётом о покрытии |
| `npm run test:e2e` | Запуск E2E-тестов (Playwright) |

---

## Структура проекта

```
frontend/
├── e2e/                        # Playwright E2E-тесты
│   ├── admin/                  # Тесты административной панели
│   └── helpers/                # Вспомогательные функции (auth и др.)
├── public/                     # Статические файлы
├── src/
│   ├── api/                    # Функции для работы с API
│   │   ├── client.ts           # Axios-инстанс с interceptors (Bearer + refresh)
│   │   ├── auth.ts             # login, register, logout, getMe, refresh
│   │   └── admin.ts            # Все admin-эндпоинты
│   ├── components/
│   │   ├── admin/              # Компоненты административной панели
│   │   │   ├── AdminLayout.tsx     # Обёртка с сайдбаром
│   │   │   ├── AdminSidebar.tsx    # Навигация (Dashboard/Users/Polls/Analytics/System)
│   │   │   ├── AdminHeader.tsx     # Заголовок страницы + кнопка действия
│   │   │   ├── StatCard.tsx        # Карточка метрики
│   │   │   ├── BulkActions.tsx     # Панель массовых операций
│   │   │   ├── AdvancedFilters.tsx # Расширенные фильтры
│   │   │   └── ExportButton.tsx    # Экспорт CSV/JSON
│   │   ├── ui/                 # Базовые UI-компоненты (Button, Badge, Spinner)
│   │   ├── AdminRoute.tsx      # Гард: только role === ADMIN
│   │   └── ProtectedRoute.tsx  # Гард: только авторизованные
│   ├── pages/
│   │   ├── admin/              # Страницы административной панели
│   │   │   ├── AdminDashboardPage.tsx  # Статистика + последние опросы
│   │   │   ├── AdminUsersPage.tsx      # Управление пользователями
│   │   │   ├── AdminPollsPage.tsx      # Управление опросами
│   │   │   ├── AdminAnalyticsPage.tsx  # Графики и аналитика
│   │   │   └── AdminSystemPage.tsx     # Мониторинг состояния системы
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── store/
│   │   └── authStore.ts        # Zustand: user + accessToken (только в памяти)
│   ├── types/                  # TypeScript-типы (User, Poll, Analytics)
│   ├── utils/
│   │   └── export.ts           # toCSV(), downloadCSV(), downloadJSON()
│   ├── test/                   # Тестовые утилиты
│   │   ├── factories.ts        # Фабрики тестовых данных
│   │   ├── renderHelpers.tsx   # renderWithProviders()
│   │   └── setup.ts            # Глобальная настройка тестов
│   ├── App.tsx                 # QueryClientProvider + восстановление сессии
│   ├── main.tsx                # Точка входа (createRoot)
│   └── router.tsx              # Маршруты (публичные / защищённые / admin)
├── .env.example
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
└── package.json
```

---

## Маршруты

### Публичные

| Путь | Страница |
|---|---|
| `/` | Лендинг |
| `/login` | Вход |
| `/register` | Регистрация |

### Защищённые (требуют авторизации)

| Путь | Страница |
|---|---|
| `/dashboard` | Личный кабинет |

### Административные (требуют `role === ADMIN`)

| Путь | Страница |
|---|---|
| `/admin` | Дашборд: статистика + последние опросы |
| `/admin/users` | Управление пользователями |
| `/admin/polls` | Управление опросами |
| `/admin/analytics` | Графики и аналитика |
| `/admin/system` | Мониторинг системы |

---

## Аутентификация

- `accessToken` хранится **только в памяти** (Zustand), никогда в `localStorage`
- `refreshToken` — httpOnly cookie, устанавливается бэкендом
- При 401 Axios-интерцептор автоматически вызывает `POST /auth/refresh` и повторяет запрос
- При старте приложения (`App.tsx`) выполняется `POST /auth/refresh` → `GET /auth/me` для восстановления сессии

---

## Тесты

### Unit-тесты (Vitest + React Testing Library)

```bash
cd frontend && npm test
```

Покрывают все admin-компоненты, страницы, API-функции и утилиты. База данных не требуется.

```bash
# с отчётом о покрытии
npm run test:coverage
```

Отчёт сохраняется в `frontend/coverage/`.

### E2E-тесты (Playwright)

Требуют запущенного бэкенда и фронтенда:

```bash
# запустить бэкенд (в отдельном терминале)
cd backend && npm run start:dev

# запустить E2E
cd frontend && npm run test:e2e
```

Тесты покрывают: вход/выход, защиту маршрутов, навигацию по admin-панели, поиск, фильтрацию, массовые операции, экспорт.

### Проверка типов

```bash
cd frontend && npm run check:ts
```

---

## Workflow разработки

### Типичный цикл при добавлении нового admin-раздела

```
1. Добавить API-функции в src/api/admin.ts
2. Добавить TypeScript-типы в src/types/
3. Создать страницу в src/pages/admin/
4. Зарегистрировать маршрут в src/router.tsx
5. Добавить пункт в AdminSidebar.tsx
6. Написать тесты в src/pages/admin/__tests__/
7. Проверить типы: npm run check:ts
8. Запустить тесты: npm test
```

### Типичный цикл при изменении API

```
1. Обновить функции в src/api/
2. Обновить типы в src/types/
3. Обновить компоненты, использующие изменённые данные
4. Обновить тесты в src/api/__tests__/
5. Проверить типы: npm run check:ts
```

### Отладка

Dev-сервер запускается с HMR — изменения применяются без перезагрузки страницы.

Для отладки сетевых запросов использовать вкладку Network в DevTools или React Query Devtools (подключить при необходимости).

---

## Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `VITE_API_BASE_URL` | Базовый URL API бэкенда | `http://localhost:3000/api/v1` |

---

## Запуск через Docker Compose

Из корня монорепозитория запустить весь стек:

```bash
docker-compose up --build
```

Фронтенд будет доступен на `http://localhost:5173`.
