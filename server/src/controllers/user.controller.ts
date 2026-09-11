import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getUserById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }

        res.status(200).json({
            status: 'ok',
            user,
        });
    } catch (error) {
        console.error('Error fetching user:', error);

        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user',
        });
    }
}