import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

describe('Subjects', () => {
  const userEmail = 'subjects-test@focusly.dev';
  const userPassword = '12345678';

  const otherUserEmail = 'subjects-other@focusly.dev';
  const otherUserPassword = '12345678';

  const agent = request.agent(app);
  const otherAgent = request.agent(app);

  let subjectId: number;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [userEmail, otherUserEmail],
        },
      },
    });

    await request(app)
      .post('/auth/register')
      .send({
        email: userEmail,
        name: 'Subjects Test',
        password: userPassword,
      });

    await request(app)
      .post('/auth/register')
      .send({
        email: otherUserEmail,
        name: 'Other User',
        password: otherUserPassword,
      });

    await agent
      .post('/auth/login')
      .send({
        email: userEmail,
        password: userPassword,
      });

    await otherAgent
      .post('/auth/login')
      .send({
        email: otherUserEmail,
        password: otherUserPassword,
      });
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
      .get('/subjects');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  it('should create a subject', async () => {
    const response = await agent
      .post('/subjects')
      .send({
        name: 'Matemática',
        color: '#3B82F6',
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');
    expect(response.body.subject.name).toBe('Matemática');
    expect(response.body.subject.color).toBe('#3B82F6');

    subjectId = response.body.subject.id;
  });

  it('should list the authenticated user subjects', async () => {
    const response = await agent
      .get('/subjects');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.subjects).toHaveLength(1);
    expect(response.body.subjects[0].id).toBe(subjectId);
    expect(response.body.subjects[0].name).toBe('Matemática');
  });

  it('should get a subject by id', async () => {
    const response = await agent
      .get(`/subjects/${subjectId}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.subject.id).toBe(subjectId);
    expect(response.body.subject.name).toBe('Matemática');
  });

  it('should update a subject', async () => {
    const response = await agent
      .put(`/subjects/${subjectId}`)
      .send({
        name: 'Matemática Avançada',
        color: '#10B981',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.subject.name).toBe('Matemática Avançada');
    expect(response.body.subject.color).toBe('#10B981');
  });

  it('should prevent another user from accessing the subject', async () => {
    const getResponse = await otherAgent
      .get(`/subjects/${subjectId}`);

    expect(getResponse.status).toBe(404);
    expect(getResponse.body.status).toBe('error');

    const updateResponse = await otherAgent
      .put(`/subjects/${subjectId}`)
      .send({
        name: 'Tentativa de invasão',
      });

    expect(updateResponse.status).toBe(404);
    expect(updateResponse.body.status).toBe('error');

    const deleteResponse = await otherAgent
      .delete(`/subjects/${subjectId}`);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body.status).toBe('error');
  });
  it('should reject subject creation without a name', async () => {
  const response = await agent
    .post('/subjects')
    .send({
      color: '#3B82F6',
    });

  expect(response.status).toBe(400);
  expect(response.body.status).toBe('error');
});

  it('should reject subject creation with an empty name', async () => {
    const response = await agent
      .post('/subjects')
      .send({
        name: '   ',
        color: '#3B82F6',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should trim the subject name', async () => {
    const response = await agent
      .post('/subjects')
      .send({
        name: '   Física   ',
        color: '#EF4444',
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');
    expect(response.body.subject.name).toBe('Física');

    await agent.delete(`/subjects/${response.body.subject.id}`);
  });

  it('should reject subject update with an empty name', async () => {
    const response = await agent
      .put(`/subjects/${subjectId}`)
      .send({
        name: '   ',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject subject update with a non-string name', async () => {
    const response = await agent
      .put(`/subjects/${subjectId}`)
      .send({
        name: 123,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject subject update with a non-string color', async () => {
    const response = await agent
      .put(`/subjects/${subjectId}`)
      .send({
        color: 123,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject invalid subject ids', async () => {
    const invalidIds = ['0', '-1', 'abc', '1.5'];

    for (const id of invalidIds) {
      const response = await agent
        .get(`/subjects/${id}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    }
  });

  it('should reject invalid subject ids when updating', async () => {
    const response = await agent
      .put('/subjects/abc')
      .send({
        name: 'Teste',
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject invalid subject ids when deleting', async () => {
    const response = await agent
      .delete('/subjects/abc');

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should delete a subject', async () => {
    const response = await agent.delete(`/subjects/${subjectId}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 after deleting the subject', async () => {
    const response = await agent
      .get(`/subjects/${subjectId}`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
  });

});
