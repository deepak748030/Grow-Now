import express from 'express';
import {
    createGoal,
    getAllGoals,
    getGoalById,
    updateGoal,
    deleteGoal
} from '../controllers/goalController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// ✅ Goal Routes
router.route('/')
    .post(upload.single('image'), createGoal)
    .get(getAllGoals);

router.route('/:id')
    .get(getGoalById)
    .patch(upload.single('image'), updateGoal)
    .delete(deleteGoal);

export default router;
