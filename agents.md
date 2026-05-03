# Agents Guide — Polls

Краткое руководство для AI-агентов, работающих с этим репозиторием.
Полная документация — в [`plans/AGENT-GUIDE.md`](plans/AGENT-GUIDE.md).

---

## Что это за проект

Веб-приложение для создания опросов и голосований.

| Слой | Стек |
|---|---|
| Бэкенд | NestJS + Prisma + PostgreSQL |
| Фронтенд | React 18 + Vite + Tailwind CSS |
| Аутентификация | JWT (access 15 мин / refresh 7 дней httpOnly cookie) |
| Контейнеризация | Docker Compose |

```
polls/
├── backend/          # NestJS (порт 3000)
├── frontend/         # React + Vite (порт 5173)
├── plans/            # Спецификации и задачи
└── docker-compose.yml
```

---

## Спецификации (читать перед работой)

| Файл | Когда читать |
|---|---|
| [`plans/00-overview.md`](plans/00-overview.md) | Всегда, первым |
| [`plans/02-data-models.md`](plans/02-data-models.md) | Перед любой задачей бэкенда |
| [`plans/03-api-spec.md`](plans/03-api-spec.md) | Перед задачами бэкенда и фронтенда |
| [`plans/05-backend-spec.md`](plans/05-backend-spec.md) | Детали реализации бэкенда |
| [`plans/04-frontend-spec.md`](plans/04-frontend-spec.md) | Детали реализации фронтенда |
| [`plans/06-implementation-tasks.md`](plans/06-implementation-tasks.md) | Конкретная задача |

---

## Запуск

```bash
# Всё через Docker
docker-compose up --build

# Бэкенд локально
cd backend && cp .env.example .env && npm install
npx prisma migrate dev
npm run start:dev

# Фронтенд локально
cd frontend && npm install && npm run dev
```

Переменные окружения: [`backend/.env.example`](backend/.env.example)

---

## Бэкенд — ключевые правила

### Структура модуля
```
src/module-name/
├── module-name.module.ts
├── module-name.controller.ts   # только HTTP, без бизнес-логики
├── module-name.service.ts      # вся логика здесь
├── guards/
└── dto/
```

### Обязательно на каждом контроллере
```typescript
@ApiTags('polls')
@Controller('polls')
export class PollsController {
  @Get()
  @ApiOperation({ summary: '...' })
  @ApiResponse({ status: 200 })
  findAll() {}
}
```

### Гарды
```typescript
@UseGuards(JwtAuthGuard)              // обязательная авторизация
@UseGuards(OptionalJwtAuthGuard)      // анонимный доступ разрешён
@UseGuards(JwtAuthGuard, PollOwnerGuard)  // только владелец или admin
@UseGuards(JwtAuthGuard, AdminGuard)  // только admin
```

### Prisma — всегда select нужные поля
```typescript
// ✅ Хорошо
const poll = await this.prisma.poll.findUnique({
  where: { slug },
  select: { id: true, title: true, owner: { select: { id: true, name: true } } },
});

// ❌ Плохо — тянет passwordHash
const poll = await this.prisma.poll.findUnique({ where: { slug } });
```

### Ошибки — только стандартные NestJS-исключения
```typescript
throw new NotFoundException('Опрос не найден');
throw new ForbiddenException('Нет доступа');
throw new ConflictException('Вы уже отвечали на этот опрос');
```

---

## Фронтенд — ключевые правила

### React Query — обязательный паттерн
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['polls', slug],
  queryFn: () => getPoll(slug),
});

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage message={error.message} />;
if (!data) return null;
return <Content data={data} />;
```

### Формы — Zod + react-hook-form
```typescript
const schema = z.object({ title: z.string().min(3).max(200) });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

### Запрещено
- Прямые вызовы `axios` в компонентах — только через функции из `src/api/`
- `accessToken` в `localStorage` — только в Zustand (память)
- `console.log` в продакшн-коде
- Захардкоженные URL — только через `import.meta.env.VITE_API_BASE_URL`

---

## Матрица доступа

| Эндпоинт | Анон | USER | Владелец | ADMIN |
|---|---|---|---|---|
| `GET /polls` | ✅ | ✅ | ✅ | ✅ |
| `GET /polls/:slug` (PUBLIC) | ✅ | ✅ | ✅ | ✅ |
| `GET /polls/:slug` (PRIVATE) | ❌ | ❌ | ✅ | ✅ |
| `POST /polls` | ❌ | ✅ | — | ✅ |
| `PATCH/DELETE /polls/:slug` | ❌ | ❌ | ✅ | ✅ |
| `POST /polls/:slug/responses` | ✅ | ✅ | ✅ | ✅ |
| `GET /polls/:slug/analytics` | ❌ | ❌ | ✅ | ✅ |
| `GET /admin/*` | ❌ | ❌ | ❌ | ✅ |

---

## Чеклист перед завершением задачи

- [ ] Нет `console.log` в коде
- [ ] Нет захардкоженных URL и секретов
- [ ] `passwordHash` не возвращается в ответах API
- [ ] **Бэкенд:** DTO валидированы через `class-validator`, Swagger-декораторы добавлены, модуль зарегистрирован в `AppModule`
- [ ] **Фронтенд:** обработаны loading / error / data, формы через Zod, TypeScript-ошибок нет (`npm run type-check`)

---

## Частые ошибки

| Ошибка | Решение |
|---|---|
| Circular dependency в NestJS | `forwardRef()` или вынести в отдельный модуль |
| N+1 запросы | `include` в Prisma вместо запросов в цикле |
| Гонка при refresh токена | Очередь запросов — один refresh, остальные ждут |
| Сломанная пагинация | Всегда возвращать `total` вместе с `data` |

---

> Подробнее: [`plans/AGENT-GUIDE.md`](plans/AGENT-GUIDE.md)
