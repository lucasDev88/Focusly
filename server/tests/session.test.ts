import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

describe("Study Sessions", () => {
  const userEmail = "sessions-test@focusly.dev";
  const userPassword = "12345678";

  const otherUserEmail = "sessions-other@focusly.dev";
  const otherUserPassword = "12345678";

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

    const userResponse = await request(app).post("/auth/register").send({
      email: userEmail,
      name: "Sessions Test",
      password: userPassword,
    });

    expect(userResponse.status).toBe(201);

    const otherUserResponse = await request(app).post("/auth/register").send({
      email: otherUserEmail,
      name: "Other User",
      password: otherUserPassword,
    });

    expect(otherUserResponse.status).toBe(201);

    const loginResponse = await agent.post("/auth/login").send({
      email: userEmail,
      password: userPassword,
    });

    expect(loginResponse.status).toBe(200);

    const otherLoginResponse = await otherAgent.post("/auth/login").send({
      email: otherUserEmail,
      password: otherUserPassword,
    });

    expect(otherLoginResponse.status).toBe(200);

    const subjectResponse = await agent.post("/subjects").send({
      name: "Matemática",
      color: "#3B82F6",
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

  it("should reject unauthenticated access", async () => {
    const response = await request(app).get("/sessions");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
  });

  it("should start a study session", async () => {
    const response = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("ok");
    expect(response.body.session.id).toBeDefined();
    expect(response.body.session.subjectId).toBe(subjectId);
    expect(response.body.session.status).toBe("ACTIVE");
    expect(response.body.session.startedAt).toBeDefined();

    sessionId = response.body.session.id;
  });

  it("should reject starting a session without subjectId", async () => {
    const response = await agent.post("/sessions/start").send({});

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject starting a session with non-integer subjectId", async () => {
    const response = await agent.post("/sessions/start").send({
      subjectId: "abc",
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject starting a session with invalid subjectId", async () => {
    const response = await agent.post("/sessions/start").send({
      subjectId: 0,
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject starting a session with decimal subjectId", async () => {
    const response = await agent.post("/sessions/start").send({
      subjectId: 1.5,
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject pausing with invalid session id", async () => {
    const response = await agent.post("/sessions/0/pause");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject pausing with non-numeric session id", async () => {
    const response = await agent.post("/sessions/abc/pause");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject resuming with invalid session id", async () => {
    const response = await agent.post("/sessions/0/resume");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject resuming with decimal session id", async () => {
    const response = await agent.post("/sessions/1.5/resume");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject finishing with invalid session id", async () => {
    const response = await agent.post("/sessions/0/finish");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should reject finishing with non-numeric session id", async () => {
    const response = await agent.post("/sessions/abc/finish");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("should list the authenticated user sessions", async () => {
    const response = await agent.get("/sessions");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0].id).toBe(sessionId);
    expect(response.body.sessions[0].subjectId).toBe(subjectId);
  });

  it("should return today sessions", async () => {
    const response = await agent.get("/sessions/today");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.sessions).toHaveLength(1);
    expect(response.body.sessions[0].id).toBe(sessionId);
  });

  it("should return study statistics", async () => {
    const response = await agent.get("/sessions/stats");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.stats).toBeDefined();
  });

  it("should prevent another active session", async () => {
    const response = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
  });

  it("should prevent another user from modifying the session", async () => {
    const response = await otherAgent.post(`/sessions/${sessionId}/pause`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
  });

  it("should pause the study session", async () => {
    const response = await agent.post(`/sessions/${sessionId}/pause`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.updateSession.id).toBe(sessionId);
    expect(response.body.updateSession.status).toBe("PAUSED");
    expect(response.body.updateSession.pausedAt).toBeDefined();
  });

  it("should resume the study session", async () => {
    const response = await agent.post(`/sessions/${sessionId}/resume`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.session.id).toBe(sessionId);
    expect(response.body.session.status).toBe("ACTIVE");
  });

  it("should finish the study session", async () => {
    const response = await agent.post(`/sessions/${sessionId}/finish`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.session.id).toBe(sessionId);
    expect(response.body.session.status).toBe("COMPLETED");
    expect(response.body.session.endedAt).toBeDefined();
    expect(response.body.session.duration).toBeDefined();
  });

  it("should not allow pausing a completed session", async () => {
    const response = await agent.post(`/sessions/${sessionId}/pause`);

    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
  });

  it("should not allow resuming a completed session", async () => {
    const response = await agent.post(`/sessions/${sessionId}/resume`);

    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
  });

  it("should not allow finishing a completed session", async () => {
    const response = await agent.post(`/sessions/${sessionId}/finish`);

    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
  });

  it("should not allow pausing an already paused session", async () => {
    const startResponse = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(startResponse.status).toBe(201);

    const pausedSessionId = startResponse.body.session.id;

    const pauseResponse = await agent.post(
      `/sessions/${pausedSessionId}/pause`,
    );

    expect(pauseResponse.status).toBe(200);

    const secondPauseResponse = await agent.post(
      `/sessions/${pausedSessionId}/pause`,
    );

    expect(secondPauseResponse.status).toBe(409);
    expect(secondPauseResponse.body.status).toBe("error");

    await prisma.studySession.delete({
      where: {
        id: pausedSessionId,
      },
    });
  });

  it("should not allow resuming an active session", async () => {
    const startResponse = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(startResponse.status).toBe(201);

    const activeSessionId = startResponse.body.session.id;

    const response = await agent.post(`/sessions/${activeSessionId}/resume`);

    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
  });

  it("should not allow another user to modify the session", async () => {
    const pauseResponse = await otherAgent.post(`/sessions/${sessionId}/pause`);

    expect(pauseResponse.status).toBe(404);
    expect(pauseResponse.body.status).toBe("error");
  });

  it("should include the completed session in statistics", async () => {
    const response = await agent.get("/sessions/stats");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.stats).toBeDefined();
  });

  it("should calculate duration correctly when finishing an active session", async () => {
    await prisma.studySession.deleteMany({
      where: {
        subjectId,
      },
    });

    const startResponse = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(startResponse.status).toBe(201);

    const testSessionId = startResponse.body.session.id;

    const startedAt = new Date(Date.now() - 120 * 1000);

    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        startedAt,
      },
    });

    const finishResponse = await agent.post(
      `/sessions/${testSessionId}/finish`,
    );

    expect(finishResponse.status).toBe(200);
    expect(finishResponse.body.session.status).toBe("COMPLETED");

    expect(finishResponse.body.session.duration).toBeGreaterThanOrEqual(119);
    expect(finishResponse.body.session.duration).toBeLessThanOrEqual(121);
  });

  it("should not count paused time in session duration", async () => {
    await prisma.studySession.deleteMany({
      where: {
        subjectId,
      },
    });

    const startResponse = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(startResponse.status).toBe(201);

    const testSessionId = startResponse.body.session.id;

    // Simula que a sessão começou há 180 segundos.
    const startedAt = new Date(Date.now() - 180 * 1000);

    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        startedAt,
      },
    });

    const pauseResponse = await agent.post(`/sessions/${testSessionId}/pause`);

    expect(pauseResponse.status).toBe(200);
    expect(pauseResponse.body.updateSession.status).toBe("PAUSED");

    // Simula que 60 segundos se passaram enquanto estava pausada.
    const pausedAt = new Date(Date.now() - 60 * 1000);

    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        pausedAt,
      },
    });

    const resumeResponse = await agent.post(
      `/sessions/${testSessionId}/resume`,
    );

    expect(resumeResponse.status).toBe(200);
    expect(resumeResponse.body.session.status).toBe("ACTIVE");

    const finishResponse = await agent.post(
      `/sessions/${testSessionId}/finish`,
    );

    expect(finishResponse.status).toBe(200);
    expect(finishResponse.body.session.status).toBe("COMPLETED");

    // 180s estudados - 60s pausados = aproximadamente 120s.
    expect(finishResponse.body.session.duration).toBeGreaterThanOrEqual(119);
    expect(finishResponse.body.session.duration).toBeLessThanOrEqual(121);
  });

  it("should calculate duration correctly with multiple pause and resume cycles", async () => {
    await prisma.studySession.deleteMany({
      where: {
        subjectId,
      },
    });

    const startResponse = await agent.post("/sessions/start").send({
      subjectId,
    });

    expect(startResponse.status).toBe(201);

    const testSessionId = startResponse.body.session.id;

    // Simula 120 segundos de estudo inicial.
    const startedAt = new Date(Date.now() - 120 * 1000);

    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        startedAt,
      },
    });

    // Primeira pausa.
    const firstPauseResponse = await agent.post(
      `/sessions/${testSessionId}/pause`,
    );

    expect(firstPauseResponse.status).toBe(200);
    expect(
      firstPauseResponse.body.updateSession.duration,
    ).toBeGreaterThanOrEqual(119);
    expect(firstPauseResponse.body.updateSession.duration).toBeLessThanOrEqual(
      121,
    );

    // Simula 30 segundos pausado.
    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        pausedAt: new Date(Date.now() - 30 * 1000),
      },
    });

    // Primeiro resume.
    const firstResumeResponse = await agent.post(
      `/sessions/${testSessionId}/resume`,
    );

    expect(firstResumeResponse.status).toBe(200);
    expect(firstResumeResponse.body.session.status).toBe("ACTIVE");

    // Para simular mais 60 segundos estudando,
    // ajustamos startedAt para representar 180 segundos
    // de tempo acumulado desde o início.
    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        startedAt: new Date(Date.now() - 180 * 1000),
      },
    });

    // Segunda pausa.
    const secondPauseResponse = await agent.post(
      `/sessions/${testSessionId}/pause`,
    );

    expect(secondPauseResponse.status).toBe(200);

    expect(
      secondPauseResponse.body.updateSession.duration,
    ).toBeGreaterThanOrEqual(179);

    expect(secondPauseResponse.body.updateSession.duration).toBeLessThanOrEqual(
      181,
    );

    // Simula 40 segundos pausado.
    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        pausedAt: new Date(Date.now() - 40 * 1000),
      },
    });

    // Segundo resume.
    const secondResumeResponse = await agent.post(
      `/sessions/${testSessionId}/resume`,
    );

    expect(secondResumeResponse.status).toBe(200);
    expect(secondResumeResponse.body.session.status).toBe("ACTIVE");

    // Simula mais 30 segundos de estudo.
    await prisma.studySession.update({
      where: {
        id: testSessionId,
      },
      data: {
        startedAt: new Date(Date.now() - 210 * 1000),
      },
    });

    // Finaliza.
    const finishResponse = await agent.post(
      `/sessions/${testSessionId}/finish`,
    );

    expect(finishResponse.status).toBe(200);
    expect(finishResponse.body.session.status).toBe("COMPLETED");

    expect(finishResponse.body.session.duration).toBeGreaterThanOrEqual(209);

    expect(finishResponse.body.session.duration).toBeLessThanOrEqual(211);
  });
  it("should prevent concurrent active sessions", async () => {
    await prisma.studySession.deleteMany({
      where: {
        subjectId,
      },
    });

    const [firstResponse, secondResponse] = await Promise.all([
      agent.post("/sessions/start").send({
        subjectId,
      }),

      agent.post("/sessions/start").send({
        subjectId,
      }),
    ]);

    const statuses = [firstResponse.status, secondResponse.status].sort();

    expect(statuses).toEqual([201, 409]);

    const activeSessions = await prisma.studySession.count({
      where: {
        subjectId,
        status: "ACTIVE",
      },
    });

    expect(activeSessions).toBe(1);
  });

  it("should not allow starting a session with another user subject", async () => {
    const otherSubjectResponse = await otherAgent.post("/subjects").send({
      name: "Física",
      color: "#EF4444",
    });

    expect(otherSubjectResponse.status).toBe(201);

    const otherSubjectId = otherSubjectResponse.body.subject.id;

    const response = await agent.post("/sessions/start").send({
      subjectId: otherSubjectId,
    });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");

    await prisma.subject.delete({
      where: {
        id: otherSubjectId,
      },
    });
  });

  it("should return 404 when finishing a non-existent session", async () => {
    const response = await agent.post("/sessions/999999/finish");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
  });

  it("should return 404 when pausing a non-existent session", async () => {
    const response = await agent.post("/sessions/999999/pause");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
  });

  it("should return 404 when resuming a non-existent session", async () => {
    const response = await agent.post("/sessions/999999/resume");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
  });
});
