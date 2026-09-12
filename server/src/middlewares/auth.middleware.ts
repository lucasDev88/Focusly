import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { env } from "../config/env";

interface AuthTokenPayLoad {
    userId: number;
}

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Authentication Expired"
                }
            );
        }

        const decoded = jwt.verify(
            token,
            env.JWT_SECRET
        ) as AuthTokenPayLoad;

        if (!decoded.userId) {
            return res.status(401).json(
                {
                    status: "error",
                    message: "Invalid authentication token."
                }
            );
        }

        req.userId = decoded.userId;

        next();
    } catch (err) {
        return res.status(401).json(
            {
                status: "error",
                message: "Invalid or expired authentication token."
            }
        )
    }
}