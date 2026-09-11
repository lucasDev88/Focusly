import { Router } from "express";

import {
    register,
    login,
    getMe,
    logout
} from "../controllers/auth.controller"

import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authenticate, getMe)

export default router;