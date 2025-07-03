import express from "express";
import {
    createTopCategory,
    getTopCategories,
    getTopCategory,
    updateTopCategory,
    patchTopCategory,
    deleteTopCategory,
} from "../controllers/topCategoryController.js";

const router = express.Router();

// Routes
router.post("/", createTopCategory);             // Create
router.get("/", getTopCategories);               // Get all
router.get("/:id", getTopCategory);              // Get one
router.put("/:id", updateTopCategory);           // Full update
router.patch("/:id", patchTopCategory);          // Partial update
router.delete("/:id", deleteTopCategory);        // Delete

export default router;
