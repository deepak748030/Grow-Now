// routes/dailyTipsRoutes.js
import express from 'express';
import {
    createDailyTip,
    getAllDailyTips,
    getDailyTipById,
    updateDailyTip,
    deleteDailyTip
} from '../controllers/DailyTipsController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Daily Tips Routes
router.route('/')
    .post(upload.single('image'), createDailyTip)
    .get(getAllDailyTips);

router.route('/:id')
    .get(getDailyTipById)
    .patch(upload.single('image'), updateDailyTip)
    .delete(deleteDailyTip);

export default router;