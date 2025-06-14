import express from 'express';
import { applyReferralCode, getAllReferralStatsForAdmin, getReferralStats } from '../controllers/referralController.js';

const router = express.Router();

// Route to get referral stats for a user
router.get('/:id/referral-stats', getReferralStats);
router.post('/apply-referral-code', applyReferralCode);
router.get('/referral-report', getAllReferralStatsForAdmin); // Assuming this is to get all referral stats for admin

export default router;