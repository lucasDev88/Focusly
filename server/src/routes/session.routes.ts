import { Router } from "express";
import {
    startSession,
    pauseSession,
    resumeSession,
    finishSession,
    getSessions,
    getTodaySessions,
    getSessionStats
} from "../controllers/session.controller"

import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/start", authenticate, startSession);
router.post("/:id/pause", authenticate, pauseSession);
router.post("/:id/resume", authenticate, resumeSession);
router.post("/:id/finish", authenticate, finishSession);

router.get("/", authenticate, getSessions);
router.get("/today", authenticate, getTodaySessions);
router.get("/stats", authenticate, getSessionStats);

export default router;