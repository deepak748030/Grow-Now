import express from 'express';
import upload from '../middleware/multer.js';
import {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    searchBrands,
} from '../controllers/brandController.js';

const router = express.Router();

// Search brands (must be before /:id route)
router.get('/search', searchBrands);

// Create and Get All Brands
router.route('/')
    .post(upload.single('image'), createBrand)
    .get(getAllBrands);

// Get, Update, Delete Brand by ID
router.route('/:id')
    .get(getBrandById)
    .patch(upload.single('image'), updateBrand)
    .delete(deleteBrand);

export default router;