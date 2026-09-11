import { Request, Response } from "express";

import prisma from "../lib/prisma";

export async function createSubject(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const { name, color } = req.body;

        if (
            typeof name !== "string" ||
            name.trim().length === 0
        ) {
            return res.status(400).json({
                status: "error",
                message: "Subject name is required",
            });
        }

        const subject = await prisma.subject.create({
            data: {
                name: name.trim(),
                color,
                userId: req.userId,
            },
        });

        return res.status(201).json({
            status: "ok",
            subject,
        });
    } catch (error) {
        console.error("Error creating subject:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to create subject",
        });
    }
}

export async function getUserSubjects(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const subjects = await prisma.subject.findMany({
            where: {
                userId: req.userId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return res.status(200).json({
            status: "ok",
            subjects,
        });
    } catch (error) {
        console.error("Error fetching subjects:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to fetch subjects",
        });
    }
}

export async function getSubjectById(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Valid subject id is required",
            });
        }

        const subject = await prisma.subject.findFirst({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!subject) {
            return res.status(404).json({
                status: "error",
                message: "Subject not found",
            });
        }

        return res.json({
            status: "ok",
            subject,
        });
    } catch (error) {
        console.error("Error fetching subject:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to fetch subject",
        });
    }
}

export async function updateSubject(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const id = Number(req.params.id);
        const { name, color } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Valid subject id is required",
            });
        }

        const subject = await prisma.subject.findFirst({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!subject) {
            return res.status(404).json({
                status: "error",
                message: "Subject not found",
            });
        }

        if (
            name !== undefined &&
            (typeof name !== "string" || name.trim().length === 0)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Subject name must be a non-empty string",
            });
        }

        if (color !== undefined && typeof color !== "string") {
            return res.status(400).json({
                status: "error",
                message: "Subject color must be a string",
            });
        }

        const updatedSubject = await prisma.subject.update({
            where: {
                id,
            },
            data: {
                ...(name !== undefined && {
                    name: name.trim(),
                }),
                ...(color !== undefined && {
                    color,
                }),
            },
        });

        return res.json({
            status: "ok",
            subject: updatedSubject,
        });
    } catch (error) {
        console.error("Error updating subject:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to update subject",
        });
    }
}

export async function deleteSubject(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Valid subject id is required",
            });
        }

        const subject = await prisma.subject.findFirst({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!subject) {
            return res.status(404).json({
                status: "error",
                message: "Subject not found",
            });
        }

        await prisma.subject.delete({
            where: {
                id,
            },
        });

        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting subject:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to delete subject",
        });
    }
}
