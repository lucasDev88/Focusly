import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

describe('Study Sessions', () => {
  const userEmail = 'sessions-test@focusly.dev';
  const userPassword = '12345678';

  const otherUserEmail = 'sessions-other@focusly.dev';
  const otherUserPassword = '12345678';

  const agent = request.agent(app);
  const otherAgent = request.agent(app);

  let subjectId: number;
  let sessionId: number;

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
        name: 'Sessions Test',
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
      .get('/sessions');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  it('should start a study session', async () => {
    const response = await agent
      .post('/sessions/start')
      .send({
        subjectId,
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');
    expect(response.body.session.id).toBeDefined();
    expect(response.body.session.subjectId).toBe(subjectId);
    expect(response.body.session.status).toBe('ACTIVE');
    expect(response.body.session.startedAt).toBeDefined();

    sessionId = response.body.session.id;
  });

  it('should list the authenticated user sessions', async () => {
    const response = await agent
      .get('/sessions');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0].id).toBe(sessionId);
    expect(response.body.sessions[0].subjectId).toBe(subjectId);
  });

  it('should return today sessions', async () => {
    const response = await agent
      .get('/sessions/today');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0].id).toBe(sessionId);
  });

  it('should return study statistics', async () => {
    const response = await agent
      .get('/sessions/stats');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.stats).toBeDefined();
  });

  it('should prevent another active session', async () => {
    const response = await agent
      .post('/sessions/start')
      .send({
        subjectId,
      });

    expect(response.status).toBe(409);
    expect(response.body.status).toBe('error');
  });

  it('should prevent another user from modifying the session', async () => {
    const response = await otherAgent
      .post(`/sessions/${sessionId}/pause`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });

  it('should pause the study session', async () => {
    const response = await agent
      .post(`/sessions/${sessionId}/pause`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.updateSession.id).toBe(sessionId);
    expect(response.body.updateSession.status).toBe('PAUSED');
    expect(response.body.updateSession.pausedAt).toBeDefined();
  });

  it('should resume the study session', async () => {
    const response = await agent
      .post(`/sessions/${sessionId}/resume`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.session.id).toBe(sessionId);
    expect(response.body.session.status).toBe('ACTIVE');
  });

  it('should finish the study session', async () => {
    const response = await agent
      .post(`/sessions/${sessionId}/finish`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.session.id).toBe(sessionId);
    expect(response.body.session.status).toBe('COMPLETED');
    expect(response.body.session.endedAt).toBeDefined();
    expect(response.body.session.duration).toBeDefined();
  });

  it('should not allow another user to modify the session', async () => {
    const pauseResponse = await otherAgent
      .post(`/sessions/${sessionId}/pause`);

    expect(pauseResponse.status).toBe(404);
    expect(pauseResponse.body.status).toBe('error');
  });

  it('should include the completed session in statistics', async () => {
    const response = await agent
      .get('/sessions/stats');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.stats).toBeDefined();
  });
});