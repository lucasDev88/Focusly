import { Router } from 'express';
import {
    createSubject,
    getUserSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
} from "../controllers/subject.controller";

const router = Router();

router.post('/', createSubject);
router.get('/:id', getSubjectById);
router.get('/user/:userId', getUserSubjects);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;