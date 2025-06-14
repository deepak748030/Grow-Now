import express from "express";
import upload from "../middleware/multer.js";
import {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    updateCategoryPatch
} from "../controllers/categoryController.js";

const router = express.Router();

// ✅ Create a new category with image upload
router.post("/", upload.single("image"), createCategory);

// ✅ Get all categories
router.get("/", getCategories);

// ✅ Get a single category by ID
router.get("/:id", getCategory);

// ✅ Update a category by ID with image upload
router.put("/:id", upload.single("image"), updateCategory);

// ✅ Delete a category by ID
router.delete("/:id", deleteCategory);

// ✅ PATCH: Update category (partial update)
router.patch("/:id", upload.single("image"), updateCategoryPatch);

export default router;
