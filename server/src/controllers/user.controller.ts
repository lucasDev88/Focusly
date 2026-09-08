import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function createUser(req: Request, res: Response) {
    try {
        const { email, name } = req.body;

        const user = await prisma.user.create({
            data: {
                email,
                name,
            },
        });

        res.status(201).json({
            status: 'ok',
            user,
        });
    } catch (error) {
        console.error('Error creating user:', error);

        res.status(500).json({
            status: 'error',
            message: 'Failed to create user',
        });
    }
}

export async function getUserById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            })
        }

        res.status(200).json({
            status: 'ok',
            user
        })
    } catch (e) {
        console.error("Error fetching user: ", e);

        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user'
        })
    }
}