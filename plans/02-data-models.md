# Polls App — Модели данных

## Диаграмма сущностей (ERD)

```mermaid
erDiagram
    User {
        uuid id PK
        string email UK
        string password_hash
        string name
        enum role
        timestamp created_at
        timestamp updated_at
    }

    Poll {
        uuid id PK
        string title
        string description
        string slug UK
        string access_token UK
        enum visibility
        boolean is_active
        timestamp expires_at
        uuid owner_id FK
        timestamp created_at
        timestamp updated_at
    }

    Question {
        uuid id PK
        uuid poll_id FK
        string text
        enum type
        int order_index
        boolean is_required
        timestamp created_at
    }

    Option {
        uuid id PK
        uuid question_id FK
        string text
        int order_index
    }

    Response {
        uuid id PK
        uuid poll_id FK
        uuid user_id FK
        string respondent_fingerprint
        timestamp submitted_at
    }

    Answer {
        uuid id PK
        uuid response_id FK
        uuid question_id FK
        uuid option_id FK
        string text_value
    }

    RefreshToken {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamp expires_at
        timestamp created_at
    }

    User ||--o{ Poll : "владеет"
    User ||--o{ Response : "отправляет"
    User ||--o{ RefreshToken : "имеет"
    Poll ||--o{ Question : "содержит"
    Poll ||--o{ Response : "получает"
    Question ||--o{ Option : "имеет"
    Response ||--o{ Answer : "содержит"
    Answer }o--o| Option : "выбирает"
```

## Prisma-схема

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum Visibility {
  PUBLIC
  PRIVATE
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  TEXT
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  role         Role     @default(USER)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  polls         Poll[]
  responses     Response[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model Poll {
  id          String     @id @default(uuid())
  title       String
  description String?
  slug        String     @unique
  accessToken String     @unique @default(uuid()) @map("access_token")
  visibility  Visibility @default(PUBLIC)
  isActive    Boolean    @default(true) @map("is_active")
  expiresAt   DateTime?  @map("expires_at")
  ownerId     String     @map("owner_id")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  owner     User       @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  questions Question[]
  responses Response[]

  @@map("polls")
}

model Question {
  id          String       @id @default(uuid())
  pollId      String       @map("poll_id")
  text        String
  type        QuestionType
  orderIndex  Int          @map("order_index")
  isRequired  Boolean      @default(true) @map("is_required")
  createdAt   DateTime     @default(now()) @map("created_at")

  poll    Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  options Option[]
  answers Answer[]

  @@map("questions")
}

model Option {
  id         String @id @default(uuid())
  questionId String @map("question_id")
  text       String
  orderIndex Int    @map("order_index")

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers  Answer[]

  @@map("options")
}

model Response {
  id                    String   @id @default(uuid())
  pollId                String   @map("poll_id")
  userId                String?  @map("user_id")
  respondentFingerprint String?  @map("respondent_fingerprint")
  submittedAt           DateTime @default(now()) @map("submitted_at")

  poll    Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  user    User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  answers Answer[]

  @@unique([pollId, userId])
  @@map("responses")
}

model Answer {
  id         String  @id @default(uuid())
  responseId String  @map("response_id")
  questionId String  @map("question_id")
  optionId   String? @map("option_id")
  textValue  String? @map("text_value")

  response Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  option   Option?  @relation(fields: [optionId], references: [id], onDelete: SetNull)

  @@map("answers")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

## Примечания по полям

### `Poll.slug`
- Человекочитаемый идентификатор URL, например `my-awesome-poll-a3f2`
- Генерируется при создании: `kebab-case(title) + '-' + nanoid(4)`
- Должен быть уникальным среди всех опросов

### `Poll.accessToken`
- UUID для доступа к приватному опросу: `/polls/private/:accessToken`
- Может быть перегенерирован владельцем

### Дедупликация `Response`
- Авторизованные пользователи: уникальное ограничение на `(pollId, userId)`
- Анонимные пользователи: `respondentFingerprint` (хеш отпечатка браузера) используется для мягкой дедупликации (best-effort)

### `Answer` для разных типов вопросов
| Тип вопроса | `optionId` | `textValue` |
|---|---|---|
| `SINGLE_CHOICE` | заполнен | null |
| `MULTIPLE_CHOICE` | заполнен | null |
| `TEXT` | null | заполнен |
