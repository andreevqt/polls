import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import cookieParser = require('cookie-parser');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Polls App E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  let accessToken: string;
  let refreshToken: string;
  let pollSlug: string;
  let pollId: string;

  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'StrongPass123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  // ─── AUTH FLOW ────────────────────────────────────────────────────────────

  describe('Auth Flow', () => {
    it('POST /api/v1/auth/register - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
        role: 'USER',
      });
      expect(response.headers['set-cookie']).toBeDefined();

      accessToken = response.body.accessToken;
      const cookieHeader = response.headers['set-cookie'];
      const cookieArray = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
      const refreshCookie = cookieArray.find((c) =>
        c && c.startsWith('refresh_token='),
      );
      refreshToken = refreshCookie?.split(';')[0].replace('refresh_token=', '') || '';
    });

    it('POST /api/v1/auth/register - should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /api/v1/auth/login - should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });

    it('POST /api/v1/auth/login - should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);
    });

    it('GET /api/v1/auth/me - should return current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: testUser.email,
        name: testUser.name,
      });
    });

    it('POST /api/v1/auth/refresh - should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${refreshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });
  });

  // ─── POLL LIFECYCLE ───────────────────────────────────────────────────────

  describe('Poll Lifecycle', () => {
    it('POST /api/v1/polls - should create a poll', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/polls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Poll',
          description: 'A poll for E2E testing',
          visibility: 'PUBLIC',
          questions: [
            {
              text: 'What is your favorite color?',
              type: 'SINGLE_CHOICE',
              orderIndex: 0,
              isRequired: true,
              options: [
                { text: 'Red', orderIndex: 0 },
                { text: 'Blue', orderIndex: 1 },
                { text: 'Green', orderIndex: 2 },
              ],
            },
            {
              text: 'Any comments?',
              type: 'TEXT',
              orderIndex: 1,
              isRequired: false,
              options: [],
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('slug');
      expect(response.body.title).toBe('E2E Test Poll');
      expect(response.body.questions).toHaveLength(2);

      pollSlug = response.body.slug;
      pollId = response.body.id;
    });

    it('GET /api/v1/polls/:slug - should get poll by slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/polls/${pollSlug}`)
        .expect(200);

      expect(response.body.slug).toBe(pollSlug);
      expect(response.body.questions).toHaveLength(2);
    });

    it('PATCH /api/v1/polls/:slug - should update poll metadata', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/polls/${pollSlug}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated E2E Test Poll' })
        .expect(200);

      expect(response.body.title).toBe('Updated E2E Test Poll');
    });

    it('GET /api/v1/polls - should list public polls', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/polls')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/polls/my - should list user polls', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/polls/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  // ─── RESPONSE SUBMISSION ──────────────────────────────────────────────────

  describe('Response Submission', () => {
    let questionId: string;
    let optionId: string;

    beforeAll(async () => {
      // Get poll details to extract question/option IDs
      const response = await request(app.getHttpServer())
        .get(`/api/v1/polls/${pollSlug}`)
        .expect(200);

      const choiceQuestion = response.body.questions.find(
        (q: any) => q.type === 'SINGLE_CHOICE',
      );
      questionId = choiceQuestion.id;
      optionId = choiceQuestion.options[0].id;
    });

    it('POST /api/v1/polls/:slug/responses - should submit a response', async () => {
      // Register a second user to submit response
      const user2 = {
        name: 'Respondent',
        email: `respondent-${Date.now()}@example.com`,
        password: 'StrongPass123!',
      };

      const regResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(user2)
        .expect(201);

      const respondentToken = regResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .post(`/api/v1/polls/${pollSlug}/responses`)
        .set('Authorization', `Bearer ${respondentToken}`)
        .send({
          answers: [
            { questionId, optionId, textValue: null },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('submittedAt');

      // Cleanup respondent
      await prisma.user.deleteMany({ where: { email: user2.email } });
    });

    it('POST /api/v1/polls/:slug/responses - should reject duplicate response', async () => {
      // The original test user already submitted (via the second user above)
      // Create another user and submit twice
      const user3 = {
        name: 'Duplicate User',
        email: `duplicate-${Date.now()}@example.com`,
        password: 'StrongPass123!',
      };

      const regResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(user3)
        .expect(201);

      const token3 = regResponse.body.accessToken;

      // First submission
      await request(app.getHttpServer())
        .post(`/api/v1/polls/${pollSlug}/responses`)
        .set('Authorization', `Bearer ${token3}`)
        .send({
          answers: [{ questionId, optionId, textValue: null }],
        })
        .expect(201);

      // Second submission - should conflict
      await request(app.getHttpServer())
        .post(`/api/v1/polls/${pollSlug}/responses`)
        .set('Authorization', `Bearer ${token3}`)
        .send({
          answers: [{ questionId, optionId, textValue: null }],
        })
        .expect(409);

      // Cleanup
      await prisma.user.deleteMany({ where: { email: user3.email } });
    });

    it('POST /api/v1/polls/:slug/responses - should reject expired poll', async () => {
      // Create an expired poll
      const expiredPollResponse = await request(app.getHttpServer())
        .post('/api/v1/polls')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Expired Poll',
          visibility: 'PUBLIC',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          questions: [
            {
              text: 'Question?',
              type: 'TEXT',
              orderIndex: 0,
              isRequired: true,
              options: [],
            },
          ],
        })
        .expect(201);

      const expiredSlug = expiredPollResponse.body.slug;

      await request(app.getHttpServer())
        .post(`/api/v1/polls/${expiredSlug}/responses`)
        .send({
          answers: [{ questionId: expiredPollResponse.body.questions[0].id, textValue: 'test' }],
        })
        .expect(410);
    });
  });

  // ─── ANALYTICS ────────────────────────────────────────────────────────────

  describe('Analytics', () => {
    it('GET /api/v1/polls/:slug/analytics - should return analytics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/polls/${pollSlug}/analytics`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalResponses');
      expect(response.body).toHaveProperty('responsesOverTime');
      expect(response.body).toHaveProperty('questions');
      expect(response.body.totalResponses).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/v1/polls/:slug/analytics/export - should export CSV', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/polls/${pollSlug}/analytics/export`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  // ─── POLL DELETION ────────────────────────────────────────────────────────

  describe('Poll Deletion', () => {
    it('DELETE /api/v1/polls/:slug - should delete poll', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/polls/${pollSlug}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('GET /api/v1/polls/:slug - should return 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/polls/${pollSlug}`)
        .expect(404);
    });
  });

  // ─── AUTH LOGOUT ──────────────────────────────────────────────────────────

  describe('Auth Logout', () => {
    it('POST /api/v1/auth/logout - should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
