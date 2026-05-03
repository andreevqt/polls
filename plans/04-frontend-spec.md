# Polls App — Спецификация фронтенда

## Технологический стек
- **Фреймворк:** React 18 + TypeScript
- **Сборщик:** Vite
- **Роутинг:** React Router v6
- **Управление состоянием:** Zustand (глобальное состояние auth) + React Query (серверное состояние)
- **Формы:** React Hook Form + Zod валидация
- **Графики:** Recharts
- **Стилизация:** Tailwind CSS
- **HTTP-клиент:** Axios (с интерцепторами для обновления токена)
- **Уведомления:** react-hot-toast

---

## Структура проекта

```
frontend/
├── public/
├── src/
│   ├── api/                  # Axios-инстанс + API-функции
│   │   ├── client.ts         # Axios-инстанс с интерцепторами
│   │   ├── auth.ts
│   │   ├── polls.ts
│   │   ├── responses.ts
│   │   └── analytics.ts
│   ├── components/           # Общие UI-компоненты
│   │   ├── ui/               # Примитивы: Button, Input, Modal, Badge, Spinner
│   │   ├── layout/           # Header, Footer, Sidebar, PageWrapper
│   │   └── polls/            # PollCard, QuestionBuilder, AnswerInput, ResultChart
│   ├── pages/                # Компоненты страниц (уровень маршрута)
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PollBuilderPage.tsx
│   │   ├── TakePollPage.tsx
│   │   ├── PollResultsPage.tsx
│   │   └── AdminPage.tsx
│   ├── store/
│   │   └── authStore.ts      # Zustand-стор для пользователя + accessToken
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePolls.ts
│   │   └── useAnalytics.ts
│   ├── types/                # TypeScript-интерфейсы, соответствующие ответам API
│   │   ├── user.ts
│   │   ├── poll.ts
│   │   └── analytics.ts
│   ├── utils/
│   │   ├── formatDate.ts
│   │   └── slugify.ts
│   ├── router.tsx            # Определения маршрутов с гардами
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Страницы

### `LandingPage` — `/`
- Hero-секция с кнопками CTA: «Создать опрос» / «Все опросы»
- Сетка публичных опросов с компонентом `PollCard`
- Пагинация
- Строка поиска (с debounce, вызывает `GET /polls?search=...`)

### `LoginPage` — `/login`
- Форма email + пароль (React Hook Form + Zod)
- При успехе: сохранить `accessToken` в Zustand, редирект на `/dashboard`
- Ссылка на `/register`

### `RegisterPage` — `/register`
- Поля: имя + email + пароль + подтверждение пароля
- При успехе: автоматический вход, редирект на `/dashboard`

### `DashboardPage` — `/dashboard` (требует авторизации)
- Таблица/сетка собственных опросов пользователя
- Колонки: Название, Видимость, Ответы, Дедлайн, Статус, Действия
- Действия: Редактировать, Результаты, Скопировать ссылку, Удалить
- Кнопка «Создать новый опрос» → `/polls/new`

### `PollBuilderPage` — `/polls/new` и `/polls/:slug/edit` (требует авторизации)
**Самая сложная страница.**

Макет:
```
[Панель настроек опроса]     [Редактор вопросов]
- Название                   - Кнопка «Добавить вопрос»
- Описание                   - Список вопросов (перетаскивание)
- Переключатель видимости    - Для каждого вопроса:
- Выбор даты дедлайна          - Поле текста вопроса
                               - Выбор типа
                               - Список вариантов (для выбора)
                               - Переключатель «Обязательный»
                               - Кнопка удаления
[Кнопка Сохранить / Опубликовать]
```

Поведение:
- Локальное состояние списка вопросов управляется через `useReducer`
- При сохранении: `POST /polls` (новый) или `PATCH /polls/:slug` + `PUT /polls/:slug/questions` (редактирование)
- Предпросмотр slug обновляется в реальном времени при вводе названия
- Валидация: минимум 1 вопрос, вопросы с выбором требуют ≥2 вариантов

### `TakePollPage` — `/polls/:slug` (публичный или приватный через `?accessToken=`)
- Рендерит каждый вопрос в зависимости от типа:
  - `SINGLE_CHOICE` → радиокнопки
  - `MULTIPLE_CHOICE` → чекбоксы
  - `TEXT` → textarea
- Прогресс-бар заполнения
- Кнопка «Отправить» → `POST /polls/:slug/responses`
- При успехе: экран «Спасибо» со ссылкой на результаты (если публичный)
- Показывает ошибку при повторном ответе или истёкшем опросе

### `PollResultsPage` — `/polls/:slug/results` (требует авторизации, владелец/admin)
- Карточка сводки: всего ответов, процент завершения
- **Линейный график:** ответы по времени (Recharts `LineChart`)
- **По каждому вопросу:**
  - `SINGLE_CHOICE` / `MULTIPLE_CHOICE` → `BarChart` или `PieChart` с количеством и процентами
  - `TEXT` → прокручиваемый список текстовых ответов
- Кнопка «Экспорт CSV» → вызывает `GET /polls/:slug/analytics/export`
- Кнопка «Поделиться опросом» → копирует ссылку в буфер обмена

### `AdminPage` — `/admin` (требует роли admin)
- Вкладки: Пользователи | Все опросы
- Вкладка пользователей: таблица с именем, email, ролью, датой создания; смена роли прямо в строке
- Вкладка опросов: таблица всех опросов, владелец, количество ответов, действия (удалить)

---

## Компоненты

### `PollCard`
Пропсы: `poll: PollSummary`
Отображает: название, имя владельца, количество ответов, бейдж дедлайна, бейдж видимости, кнопку «Пройти опрос».

### `QuestionBuilder`
Пропсы: `question: QuestionDraft, onChange, onDelete`
Рендерит редактор вопроса с полями ввода вариантов в зависимости от типа.

### `AnswerInput`
Пропсы: `question: Question, value, onChange`
Рендерит подходящий элемент ввода для прохождения опроса (radio / checkbox / textarea).

### `ResultChart`
Пропсы: `question: AnalyticsQuestion`
Рендерит столбчатый график для вопросов с выбором или список текстов для текстовых вопросов.

### `ProtectedRoute`
Оборачивает маршруты, требующие авторизации. Перенаправляет на `/login` при отсутствии токена.

### `AdminRoute`
Расширяет `ProtectedRoute`. Перенаправляет на `/` если роль не `ADMIN`.

---

## Управление состоянием

### Zustand Auth Store (`authStore.ts`)
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}
```
- `accessToken` хранится только в памяти (не в localStorage) из соображений безопасности
- При загрузке приложения: вызывается `POST /auth/refresh` для восстановления сессии из httpOnly cookie

### Ключи React Query
```typescript
// опросы
['polls']                          // публичный список
['polls', slug]                    // один опрос
['my-polls']                       // список в дашборде
['analytics', slug]                // данные аналитики

// авторизация
['me']                             // текущий пользователь
```

---

## Axios-интерцепторы (`client.ts`)

```typescript
// Интерцептор запроса: добавляет access-токен
config.headers.Authorization = `Bearer ${accessToken}`

// Интерцептор ответа: при 401 вызывает /auth/refresh, повторяет исходный запрос
// Если refresh не удался: clearAuth() + редирект на /login
```

---

## Маршрутизация (`router.tsx`)

```typescript
const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/polls/new', element: <PollBuilderPage /> },
      { path: '/polls/:slug/edit', element: <PollBuilderPage /> },
      { path: '/polls/:slug/results', element: <PollResultsPage /> },
    ]
  },
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin', element: <AdminPage /> },
    ]
  },
  { path: '/polls/:slug', element: <TakePollPage /> },
])
```

---

## Переменные окружения

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
