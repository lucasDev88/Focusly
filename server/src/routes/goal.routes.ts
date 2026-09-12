import { Router } from 'express';

import {
    createGoal,
    getUserGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
    getGoalProgress,
} from '../controllers/goal.controller';

import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createGoal);
router.get('/', authenticate, getUserGoals);
router.get('/:id/progress', authenticate, getGoalProgress);
router.get('/:id', authenticate, getGoalById);
router.put('/:id', authenticate, updateGoal);
router.delete('/:id', authenticate, deleteGoal);

export default router;