import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

describe('Goals', () => {
  const userEmail = 'goals-test@focusly.dev';
  const userPassword = '12345678';

  const otherUserEmail = 'goals-other@focusly.dev';
  const otherUserPassword = '12345678';

  const agent = request.agent(app);
  const otherAgent = request.agent(app);

  let subjectId: number;
  let goalId: number;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [userEmail, otherUserEmail],
        },
      },
    });

    const userResponse = await request(app)
      .post('/auth/register')
      .send({
        email: userEmail,
        name: 'Goals Test',
        password: userPassword,
      });

    expect(userResponse.status).toBe(201);

    const otherUserResponse = await request(app)
      .post('/auth/register')
      .send({
        email: otherUserEmail,
        name: 'Other User',
        password: otherUserPassword,
      });

    expect(otherUserResponse.status).toBe(201);

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        email: userEmail,
        password: userPassword,
      });

    expect(loginResponse.status).toBe(200);

    const otherLoginResponse = await otherAgent
      .post('/auth/login')
      .send({
        email: otherUserEmail,
        password: otherUserPassword,
      });

    expect(otherLoginResponse.status).toBe(200);

    const subjectResponse = await agent
      .post('/subjects')
      .send({
        name: 'Matemática',
        color: '#3B82F6',
      });

    expect(subjectResponse.status).toBe(201);

    subjectId = subjectResponse.body.subject.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [userEmail, otherUserEmail],
        },
      },
    });

    await prisma.$disconnect();
  });

  it('should reject unauthenticated access', async () => {
    const response = await request(app)
      .get('/goals');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  it('should create a goal with a subject', async () => {
    const response = await agent
      .post('/goals')
      .send({
        subjectId,
        title: 'Estudar Matemática',
        targetMinutes: 120,
        period: 'DAILY',
        startDate: '2026-09-15T00:00:00.000Z',
        endDate: '2026-09-16T00:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');

    expect(response.body.goal.id).toBeDefined();
    expect(response.body.goal.subjectId).toBe(subjectId);
    expect(response.body.goal.title).toBe('Estudar Matemática');
    expect(response.body.goal.targetMinutes).toBe(120);
    expect(response.body.goal.period).toBe('DAILY');

    goalId = response.body.goal.id;
  });

  it('should create a goal without a subject', async () => {
    const response = await agent
      .post('/goals')
      .send({
        title: 'Estudar no geral',
        targetMinutes: 180,
        period: 'WEEKLY',
        startDate: '2026-09-15T00:00:00.000Z',
        endDate: '2026-09-22T00:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');
    expect(response.body.goal.subjectId).toBeNull();
    expect(response.body.goal.period).toBe('WEEKLY');
  });

  it('should list the authenticated user goals', async () => {
    const response = await agent
      .get('/goals');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.goals).toHaveLength(2);

    expect(response.body.goals[0].subject).toBeDefined();
  });

  it('should get a goal by id', async () => {
    const response = await agent
      .get(`/goals/${goalId}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.goal.id).toBe(goalId);
    expect(response.body.goal.subjectId).toBe(subjectId);
  });

  it('should prevent another user from accessing the goal', async () => {
    const response = await otherAgent
      .get(`/goals/${goalId}`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });

  it('should update the goal', async () => {
    const response = await agent
      .put(`/goals/${goalId}`)
      .send({
        title: 'Estudar Matemática Avançada',
        targetMinutes: 180,
        period: 'WEEKLY',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.goal.id).toBe(goalId);
    expect(response.body.goal.title).toBe('Estudar Matemática Avançada');
    expect(response.body.goal.targetMinutes).toBe(180);
    expect(response.body.goal.period).toBe('WEEKLY');
  });

  it('should prevent another user from updating the goal', async () => {
    const response = await otherAgent
      .put(`/goals/${goalId}`)
      .send({
        title: 'Tentativa de invasão',
      });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });

  it('should reject invalid goal data', async () => {
    const response = await agent
      .post('/goals')
      .send({
        title: 'Meta inválida',
        targetMinutes: 0,
        period: 'INVALID',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject a goal with an invalid date range', async () => {
    const response = await agent
      .post('/goals')
      .send({
        title: 'Meta inválida',
        targetMinutes: 120,
        period: 'DAILY',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-09-15T00:00:00.000Z',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject a goal using another user subject', async () => {
    const otherSubjectResponse = await otherAgent
      .post('/subjects')
      .send({
        name: 'Física',
        color: '#EF4444',
      });

    expect(otherSubjectResponse.status).toBe(201);

    const otherSubjectId = otherSubjectResponse.body.subject.id;

    const response = await agent
      .post('/goals')
      .send({
        subjectId: otherSubjectId,
        title: 'Meta com matéria de outro usuário',
        targetMinutes: 120,
        period: 'DAILY',
        startDate: '2026-09-15T00:00:00.000Z',
        endDate: '2026-09-16T00:00:00.000Z',
      });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });

  it('should return zero progress when there are no completed sessions', async () => {
    const response = await agent
      .get(`/goals/${goalId}/progress`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.progress.targetMinutes).toBe(180);
    expect(response.body.progress.studiedMinutes).toBe(0);
    expect(response.body.progress.remainingMinutes).toBe(180);
    expect(response.body.progress.percentage).toBe(0);
  });

  it('should calculate progress from completed study sessions', async () => {
    const sessionResponse = await agent
      .post('/sessions/start')
      .send({
        subjectId,
      });

    expect(sessionResponse.status).toBe(201);

    const sessionId = sessionResponse.body.session.id;

    await prisma.studySession.update({
      where: {
        id: sessionId,
      },
      data: {
        startedAt: new Date('2026-09-15T10:00:00.000Z'),
        endedAt: new Date('2026-09-15T11:30:00.000Z'),
        duration: 5400,
        status: 'COMPLETED',
      },
    });

    const response = await agent
      .get(`/goals/${goalId}/progress`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.progress.targetMinutes).toBe(180);
    expect(response.body.progress.studiedMinutes).toBe(90);
    expect(response.body.progress.remainingMinutes).toBe(90);
    expect(response.body.progress.percentage).toBe(50);
  });

  it('should prevent another user from accessing goal progress', async () => {
    const response = await otherAgent
      .get(`/goals/${goalId}/progress`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });

  it('should delete the goal', async () => {
    const response = await agent
      .delete(`/goals/${goalId}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should return 404 after deleting the goal', async () => {
    const response = await agent
      .get(`/goals/${goalId}`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });
});