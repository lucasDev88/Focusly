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

const router = Router();

router.post("/start", startSession)
router.post("/:id/pause", pauseSession)
router.post("/:id/resume", resumeSession)
router.post("/:id/finish", finishSession)

router.get("/", getSessions)
router.get("/today", getTodaySessions)
router.get("/stats", getSessionStats)

export default router;