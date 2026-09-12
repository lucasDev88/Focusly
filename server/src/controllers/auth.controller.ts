import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import prisma from "../lib/prisma"
import bcrypt from "bcrypt"
import { env } from "../config/env";

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export async function register(req: Request, res: Response) {
    try {
        const { email, name, password } = req.body

        if (!email || !password) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Email and password are required"
                }
            );
        }

        if (typeof email !== "string" || typeof password !== 'string') {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Email and password must be at least 8 characters long"
                }
            );
        }

        const normalizedEmail = normalizeEmail(email)

        if (!normalizedEmail) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Email is required"
                }
            )
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Password must be at least 8 characters long"
                }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Email already registred."
                }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: name ?? null,
                password: passwordHash
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        })

        return res.status(201).json(
            {
                status: "sucess",
                user
            }
        )

    } catch (err) {
        console.error("Error registring client: ", err)

        res.status(500).json(
            {
                status: "error",
                message: "Failed to register client."
            }
        )
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Email and password are required"
                }
            );
        }

        if (typeof email !== "string" || typeof password !== 'string') {
            return res.status(400).json(
                {
                    status: "error",
                    message: "Email and password must be strings"
                }
            );
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        })

        if (!user) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Invalid email or password"
                }
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Invalid email or password."
                }
            )
        }

        const token = jwt.sign(
            {
                userId: user.id,
            },
            env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        )

        return res
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV == 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .status(200)
            .json(
                {
                    status: "sucess",
                    user: {
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        createdAt: user.createdAt
                    }
                }
            )
    } catch (err) {
        console.error("Error logging in: ", err)

        res.status(500).json(
            {
                status: "error",
                message: "Failed to login, Internal Server Error"
            }
        )
    } 
}

export async function getMe(req: Request, res: Response) {
    try {
        if (!req.userId) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Authentication required"
                }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        })

        if (!user) {
            return res.status(404).json(
                {
                    status: "error",
                    message: "User not found"
                }
            );
        }

        return res.status(200).json(
            {
                status: "ok",
                user
            }
        )
    } catch (err) {
        console.error('Error fetching authenticated user: ', err)

        return res.status(500).json(
            {
                status: "error",
                message: "Failed to fetch authenticated user."
            }
        )
    }
}

export const logout = (req: Request, res: Response) => {
    return res
        .clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
        .json(
            {
                status: "sucess",
                message: "Logged out successfuly"
            }
        )
}