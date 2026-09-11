import { Router } from "express";

import {
    createSubject,
    getUserSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
} from "../controllers/subject.controller";

import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createSubject);
router.get("/", authenticate, getUserSubjects);
router.get("/:id", authenticate, getSubjectById);
router.put("/:id", authenticate, updateSubject);
router.delete("/:id", authenticate, deleteSubject);

export default router;