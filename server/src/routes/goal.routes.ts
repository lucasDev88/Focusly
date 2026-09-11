import { Router } from 'express';

import {
    createGoal,
    getUserGoals,
    getGoalById,
    updateGoal,
    deleteGoal,
    getGoalProgress,
} from '../controllers/goal.controller';

const router = Router();

router.post('/', createGoal);
router.get('/user/:userId', getUserGoals);
router.get('/:id/progress', getGoalProgress);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;