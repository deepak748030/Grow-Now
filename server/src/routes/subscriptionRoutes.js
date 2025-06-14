import express from 'express';
import {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
} from '../controllers/subscriptionController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Routes
router.post('/', upload.array('images', 10), createSubscription);
router.get('/', getAllSubscriptions);
router.get('/:id', getSubscriptionById);
router.patch('/:id', upload.array('images', 10), updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;

