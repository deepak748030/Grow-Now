// routes/productRoutes.js
import express from 'express';
import upload from '../middleware/multer.js';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCreator,
    updateProductStatus,
    searchProducts,
    getProductsByCreatorId,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/search', searchProducts);
// Create and Get All Products
router.get('/creator/:creatorId', getProductsByCreatorId);

router.route('/')
    .post(upload.array('images', 10), createProduct)
    .get(getAllProducts);

// Get, Update, Delete Product by ID
router.route('/:id')
    .get(getProductById)
    .patch(upload.array('images', 10), updateProduct)
    .delete(deleteProduct);

// Get Products by Creator
router.get('/creator/:creatorId', getProductsByCreator);

// Update Product Status
router.patch('/status/:id', updateProductStatus);

export default router;