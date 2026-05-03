# Polls App — Спецификация бэкенда

## Технологический стек
- **Runtime:** Node.js 20 LTS
- **Фреймворк:** NestJS 10
- **ORM:** Prisma 5
- **База данных:** PostgreSQL 16
- **Авторизация:** `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`
- **Валидация:** `class-validator` + `class-transformer`
- **Хеширование паролей:** `bcrypt`
- **Генерация slug:** `nanoid` + кастомный util slugify
- **Экспорт CSV:** `csv-stringify`
- **Rate limiting:** `@nestjs/throttler`
- **Документация API:** `@nestjs/swagger`
- **Конфигурация:** `@nestjs/config` + `.env`

---

## Структура проекта

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts          # Валидирует access-токен
│   │   │   └── jwt-refresh.strategy.ts  # Валидирует refresh-токен из cookie
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt-refresh.guard.ts
│   │   │   └── optional-jwt.guard.ts    # Не бросает ошибку при отсутствии токена
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── update-user.dto.ts
│   ├── polls/
│   │   ├── polls.module.ts
│   │   ├── polls.controller.ts
│   │   ├── polls.service.ts
│   │   ├── guards/
│   │   │   └── poll-owner.guard.ts      # Проверяет req.user.id === poll.ownerId
│   │   └── dto/
│   │       ├── create-poll.dto.ts
│   │       ├── update-poll.dto.ts
│   │       └── poll-query.dto.ts
│   ├── questions/
│   │   ├── questions.module.ts
│   │   ├── questions.service.ts
│   │   └── dto/
│   │       └── replace-questions.dto.ts
│   ├── responses/
│   │   ├── responses.module.ts
│   │   ├── responses.controller.ts
│   │   ├── responses.service.ts
│   │   └── dto/
│   │       └── submit-response.dto.ts
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   └── analytics.service.ts
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   └── guards/
│   │       └── admin.guard.ts           # Проверяет req.user.role === ADMIN
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Единый формат ответа об ошибке
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts # Оборачивает ответы в { data }
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   └── utils/
│   │       ├── slugify.ts
│   │       └── pagination.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
├── .env
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Описание модулей

### `PrismaService`
Расширяет `PrismaClient`, реализует `OnModuleInit` для вызова `$connect()` и `OnModuleDestroy` для вызова `$disconnect()`. Экспортируется как глобальный модуль.

---

### `AuthModule`

#### Методы `AuthService`:
| Метод | Описание |
|---|---|
| `register(dto)` | Хеширует пароль, создаёт пользователя, генерирует токены |
| `login(dto)` | Валидирует учётные данные, генерирует токены |
| `refresh(userId, refreshToken)` | Валидирует сохранённый хеш, ротирует refresh-токен |
| `logout(userId)` | Удаляет refresh-токен из БД |
| `generateTokens(userId, role)` | Возвращает `{ accessToken, refreshToken }` |
| `storeRefreshToken(userId, token)` | Хеширует токен через bcrypt, делает upsert в БД |
| `validateRefreshToken(userId, token)` | Сравнивает с сохранённым хешем |

#### Генерация токенов:
```typescript
// Payload access-токена
{ sub: userId, role: userRole }
// TTL: 15 минут

// Payload refresh-токена
{ sub: userId }
// TTL: 7 дней, хранится как bcrypt-хеш в БД
```

#### `JwtStrategy`:
- Извлекает токен из заголовка `Authorization: Bearer`
- Валидирует подпись и срок действия
- Возвращает `{ id, role }` как `req.user`

#### `JwtRefreshStrategy`:
- Извлекает токен из httpOnly cookie `refresh_token`
- Возвращает `{ id, refreshToken }` как `req.user`

---

### `PollsModule`

#### Методы `PollsService`:
| Метод | Описание |
|---|---|
| `findAll(query)` | Пагинированные публичные активные опросы |
| `findBySlug(slug, accessToken?)` | Один опрос с вопросами; валидирует приватный доступ |
| `create(userId, dto)` | Создаёт опрос + вопросы + варианты в транзакции |
| `update(slug, dto)` | Частичное обновление метаданных опроса |
| `delete(slug)` | Каскадное удаление через Prisma |
| `replaceQuestions(slug, dto)` | Diff и upsert вопросов/вариантов в транзакции |
| `regenerateAccessToken(slug)` | Генерирует новый UUID access-токен |

#### Генерация slug:
```typescript
// utils/slugify.ts
import { nanoid } from 'nanoid';

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return `${base}-${nanoid(4)}`;
}
```

#### `PollOwnerGuard`:
```typescript
// Получает опрос по slug из параметра маршрута, проверяет poll.ownerId === req.user.id
// Роль admin обходит эту проверку
```

---

### `ResponsesModule`

#### Методы `ResponsesService`:
| Метод | Описание |
|---|---|
| `submit(slug, dto, userId?, fingerprint?)` | Валидирует активность/срок опроса, проверяет дедупликацию, создаёт ответ + answers в транзакции |
| `findByPoll(slug, query)` | Пагинированные ответы с answers |

#### Логика дедупликации:
```typescript
if (userId) {
  // Проверяет уникальное ограничение (pollId, userId) — бросает 409 если существует
} else {
  // Проверяет по respondentFingerprint — мягкая проверка, предупреждает но разрешает если нет совпадения
}
```

---

### `AnalyticsModule`

#### Методы `AnalyticsService`:
| Метод | Описание |
|---|---|
| `getAnalytics(slug)` | Агрегирует количество по вариантам, текстовые ответы, ответы по времени |
| `exportCsv(slug, res)` | Стримит CSV в ответ через `csv-stringify` |

#### SQL-агрегация `getAnalytics` (через Prisma raw или query):
- `responsesOverTime`: `GROUP BY DATE(submitted_at)` по таблице responses
- Количество по вариантам: `COUNT(answers.option_id) GROUP BY option_id`
- Текстовые ответы: `SELECT text_value FROM answers WHERE question_id = ?`

---

### `AdminModule`

#### Гарды:
- `AdminGuard`: проверяет `req.user.role === 'ADMIN'`, иначе бросает `ForbiddenException`

#### Эндпоинты делегируют в `UsersService` и `PollsService`.

---

## DTO

### `CreatePollDto`
```typescript
class CreateOptionDto {
  @IsString() @MinLength(1) text: string;
  @IsInt() @Min(0) orderIndex: number;
}

class CreateQuestionDto {
  @IsString() @MinLength(1) text: string;
  @IsEnum(QuestionType) type: QuestionType;
  @IsInt() @Min(0) orderIndex: number;
  @IsBoolean() isRequired: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

class CreatePollDto {
  @IsString() @MinLength(3) @MaxLength(200) title: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(Visibility) visibility: Visibility;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateQuestionDto)
  @ArrayMinSize(1) questions: CreateQuestionDto[];
}
```

### `SubmitResponseDto`
```typescript
class SubmitAnswerDto {
  @IsUUID() questionId: string;
  @IsOptional() @IsUUID() optionId?: string;
  @IsOptional() @IsString() textValue?: string;
}

class SubmitResponseDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}
```

---

## Инициализация `main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Polls API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(3000);
}
```

---

## Переменные окружения

```env
# .env.example
DATABASE_URL=postgresql://postgres:password@localhost:5432/polls
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=3000
```

---

## Docker-конфигурация

### `backend/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
CMD ["node", "dist/main"]
```

### `docker-compose.yml` (корень проекта)
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: polls
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/polls
      JWT_ACCESS_SECRET: change_me_access
      JWT_REFRESH_SECRET: change_me_refresh
      FRONTEND_URL: http://localhost:5173
    depends_on:
      - postgres
    command: sh -c "npx prisma migrate deploy && node dist/main"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
    depends_on:
      - backend

volumes:
  pgdata:
```
