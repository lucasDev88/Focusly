import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

describe('Authentication', () => {
  const email = 'auth-test@focusly.dev';
  const password = '12345678';

  const agent = request.agent(app);

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email },
    });

    await prisma.$disconnect();
  });

  it('should reject unauthenticated access to /auth/me', async () => {
    const response = await request(app)
      .get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email,
        name: 'Auth Test',
        password,
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('ok');
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.name).toBe('Auth Test');
    expect(response.body.user.password).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email,
        name: 'Auth Test',
        password,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should reject invalid password during login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email,
        password: 'wrong-password',
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });

  it('should login successfully', async () => {
    const response = await agent
      .post('/auth/login')
      .send({
        email,
        password,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.name).toBe('Auth Test');
    expect(response.body.user.password).toBeUndefined();
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should return the authenticated user from /auth/me', async () => {
    const response = await agent
      .get('/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.name).toBe('Auth Test');
    expect(response.body.user.password).toBeUndefined();
  });

  it('should logout successfully', async () => {
    const response = await agent
      .post('/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should reject /auth/me after logout', async () => {
    const response = await agent
      .get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });
});
