import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Product Routes
router.route('/')
    .post(upload.array('images', 10), createProduct) // Allow up to 10 images
    .get(getAllProducts);

router.route('/:id')
    .get(getProductById)
    .patch(upload.array('images', 10), updateProduct) // Allow up to 10 images
    .delete(deleteProduct);

export default router;
