import express from 'express';
import upload from '../middleware/multer.js';
import {
    createBulkDelivery,
    deleteBulkDelivery,
    getAllBulkDeliveries,
    updateBulkDeliveryStatus
} from '../controllers/bulkProductDeliveryController.js';

const router = express.Router();

router.post('/', upload.single('image'), createBulkDelivery);
router.get('/', getAllBulkDeliveries);
router.patch('/status/:id', updateBulkDeliveryStatus);
router.delete('/:id', deleteBulkDelivery);

export default router;
