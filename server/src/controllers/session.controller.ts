import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function startSession(req: Request, res: Response) {
    try {
        const { subjectId } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const subject = await prisma.subject.findUnique({
            where: { 
                id: subjectId,
                userId
            }
        })

        if (!subject) {
            return res.status(404).json(
                {
                    status: "error",
                    message: "Subject not found."
                }
            )
        }

        const activeSession = await prisma.studySession.findFirst({
            where: {
                userId,
                status: {
                    in: ['ACTIVE', 'PAUSED']
                }
            }
        })

        if (activeSession) {
            return res.status(409).json(
                {
                    status: "error",
                    message: "User already has an active session."
                }
            )
        }

        const session = await prisma.studySession.create({
            data: {
                userId,
                subjectId,
                status: "ACTIVE"
            }
        })

        return res.status(201).json(
            {
                status: "ok",
                session
            }
        )

    } catch (err) {
        console.error("Error starting session: ", err)
        
        return res.status(500).json(
            {
                status: "error",
                message: "Failed to start session"
            }
        )
    }
}

export async function pauseSession(req: Request, res: Response) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Valid session id is required"
                }
            )
        }

        const session = await prisma.studySession.findUnique({
            where: {
                id,
                userId
            }
        })

        if (!session) {
            return res.status(404).json(
                {
                    status: "error",
                    message: "Session not found"
                }
            )
        }

        if (session.status !== "ACTIVE") {
            return res.status(409).json(
                {
                    status: "error",
                    message: "Only active sessions can be paused"
                }
            )
        }

        const now = new Date();

        const elapsedSeconds = Math.floor(
            (now.getTime() - session.startedAt.getTime()) / 1000
        );

        const updateSession = await prisma.studySession.update({
            where: {id},
            data: {
                status: "PAUSED",
                duration: elapsedSeconds,
                pausedAt: now
            }
        })

        return res.status(201).json(
            {
                status: "ok",
                updateSession
            }
        )
    } catch (err) {
        console.error("Error pausing session: ", err)

        return res.status(500).json(
            {
                status: "error",
                message: "Failed to pausing session"
            }
        )
    }
}

export async function resumeSession(req: Request, res: Response) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Valid session id is required"
                }
            )
        }

        const session = await prisma.studySession.findUnique({
            where: { 
                id,
                userId
            },
        })

        if (!session) {
            return res.status(404).json(
                {
                    status: "error",
                    message: "Session not found"
                }
            )
        }

        if (session.status !== "PAUSED") {
            return res.status(409).json(
                {
                    status: "error",
                    message: "Only paused sessions can be resumed"
                }
            )
        }

        const now = new Date();

        const pausedSeconds = session.pausedAt
            ? Math.floor(
                (now.getTime() - session.pausedAt.getTime()) / 1000
            )
            : 0;
        
        const newStartedAt = new Date(
            session.startedAt.getTime() + pausedSeconds * 1000
        );

        const updatedSession = await prisma.studySession.update({
            where: { id },
            data: {
                status: "ACTIVE",
                startedAt: newStartedAt,
                pausedAt: null
            }
        })

        return res.status(201).json(
            {
                status: "ok",
                session: updatedSession
            }
        )
    } catch (err) {
        console.error("Error resuming session: ", err)

        return res.status(500).json(
            {
                status: "error",
                message: "Failed to resume sesssion",
            }
        )
    }
}

export async function finishSession(req: Request, res: Response) {
    try {
        const userId = req.userId

        if (!userId) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Authentication required."
                }
            )
        }

        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Valid session id is required"
                }
            )
        }

        const session = await prisma.studySession.findUnique({
            where: { 
                id,
                userId
            }
        })

        if (!session) {
            return res.status(404).json(
                {
                    status: "error",
                    message: "Session not found "
                }
            )
        }

        if (
            session.status !== 'ACTIVE' &&
            session.status !== 'PAUSED'
        ) {
            return res.status(409).json(
                {
                    status: "error",
                    message: "Only active or paused sessions can be finished"
                }
            )
        }

        const now = new Date()

        let duration = session.duration ?? 0;

        if (session.status === "ACTIVE") {
            const elapsedSeconds = Math.floor(
                (now.getTime() - session.startedAt.getTime()) / 1000
            );

            duration = elapsedSeconds;
        }

        const updateSession = await prisma.studySession.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                endedAt: now,
                duration,
                pausedAt: null
            }
        })

        return res.status(201).json(
            {
                status: "ok",
                session: updateSession
            }
        )
    } catch (err) {
        console.error("Error finish session: ", err)

        return res.status(500).json(
            {
                status: "error",
                message: "Failed to finish session"
            }
        )
    }
}

export async function getSessions(req: Request, res: Response) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const sessions = await prisma.studySession.findMany({
            where: {
                userId
            },
            orderBy: {
                startedAt: 'desc'
            }
        })

        return res.status(201).json(
            {
                status: "ok",
                sessions
            }
        )
    } catch (err) {
        console.error("Error fetching sessions: ", err)

        return res.status(500).json(
            {
                status: "error",
                message: "Failed to fetch sessions"
            }
        )
    } 
}

export async function getTodaySessions(req: Request, res: Response) {
    try {
        const userId = req.userId

        if (!userId) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Authentication required"
                }
            )
        }

        const now = new Date();

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await prisma.studySession.findMany({
            where: {
                userId,
                startedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
        });

        return res.json({
            status: 'ok',
            sessions,
        });
    } catch (error) {
        console.error('Error fetching today sessions:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch today sessions',
        });
    }
}

export async function getSessionStats(req: Request, res: Response) {
    try {
        const userId = req.userId

        if (!userId) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Authentication required"
                }
            )
        }

        const sessions = await prisma.studySession.findMany({
            where: {
                userId,
            },
            select: {
                duration: true,
                status: true,
            },
        });

        const totalSessions = sessions.length;

        const completedSessions = sessions.filter(
            (session) => session.status === 'COMPLETED'
        ).length;

        const totalDuration = sessions.reduce(
            (total, session) => total + (session.duration ?? 0),
            0
        );

        return res.json({
            status: 'ok',
            stats: {
                totalSessions,
                completedSessions,
                totalDuration,
            },
        });
    } catch (error) {
        console.error('Error fetching session stats:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch session stats',
        });
    }
}