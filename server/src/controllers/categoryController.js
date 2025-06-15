import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
// import redis from "../redis/redisClient.js";
// Optional: A simple logger helper (replace with your enterprise logger)
const logger = {
    info: (msg, meta) => console.info(msg, meta || ""),
    error: (msg, meta) => console.error(msg, meta || ""),
};

/**
 * Helper function to delete a file if it exists.
 * Uses promises for asynchronous file deletion.
 *
 * @param {string} filePath - The file path to delete.
 */
const deleteFile = async (filePath) => {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            logger.info(`Deleted file: ${filePath}`);
        } else {
            logger.info(`File not found (skipping delete): ${filePath}`);
        }
    } catch (error) {
        logger.error(`Error deleting file ${filePath}:`, error);
    }
};

/**
 * ✅ Create a new category.
 * Validates required fields, checks for duplicates, and creates a new Category document.
 */
export const createCategory = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, error: "Title is required." });
        }

        // Check if category already exists
        const existingCategory = await Category.exists({ title });
        if (existingCategory) {
            return res.status(400).json({ success: false, error: "Category already exists." });
        }

        // Process image if provided
        const image = req.file ? req.file.path.replace(/\\/g, "/") : "";

        // Create category
        const category = await Category.create({ title, image });
        logger.info("Category created", { categoryId: category._id, title });

        res.status(201).json({
            success: true,
            message: "Category created successfully!",
            data: category,
        });
    } catch (error) {
        logger.error("Create Category Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

/**
 * ✅ Get all categories.
 * Retrieves a list of all categories with selected fields.
 */
export const getCategories = async (req, res) => {
    try {
        const cacheKey = "categories";
        // const cachedCategories = await redis.get(cacheKey);

        if (cachedCategories) {
            logger.info("Cache hit for categories");
            return res.json({ success: true, data: JSON.parse(cachedCategories) });
        }

        logger.info("Cache miss for categories, fetching from database");
        const categories = await Category.find({}, "_id title image").lean();

        // Cache the result for future requests
        // await redis.set(cacheKey, JSON.stringify(categories), "EX", 3600); // Cache for 1 hour

        res.json({ success: true, data: categories });
    } catch (error) {
        logger.error("Get Categories Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

/**
 * ✅ Get a single category by ID.
 * Retrieves one category using its ID.
 */
export const getCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id, "_id title image").lean();

        if (!category) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        logger.error("Get Category Error:", error);
        res.status(400).json({ success: false, error: "Invalid Category ID." });
    }
};

/**
 * ✅ Update category with optional image upload.
 * Updates the category title and/or image. If a new image is provided,
 * the old image is deleted from disk to conserve space.
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const newImage = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

        // Retrieve the current document for modification
        const categoryDoc = await Category.findById(id);
        if (!categoryDoc) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        // Update title if provided and unique
        if (title && title !== categoryDoc.title) {
            const duplicate = await Category.findOne({ title, _id: { $ne: id } })
                .select("_id")
                .lean();
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            categoryDoc.title = title;
        }

        // Update image if provided: delete old file and set new image path
        if (newImage) {
            if (categoryDoc.image) {
                await deleteFile(categoryDoc.image);
            }
            categoryDoc.image = newImage;
        }

        const updatedCategory = await categoryDoc.save();
        logger.info("Category updated", { categoryId: updatedCategory._id });
        res.json({
            success: true,
            message: "Category updated successfully!",
            data: updatedCategory,
        });
    } catch (error) {
        logger.error("Update Category Error:", error);
        res.status(400).json({ success: false, error: "Invalid Update Data." });
    }
};

/**
 * ✅ Delete category with image cleanup.
 * Deletes the category document and removes the associated image file from disk.
 */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Find the category to get the image path before deletion.
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        // Delete associated image if exists.
        if (category.image) {
            await deleteFile(category.image);
        }

        await Category.findByIdAndDelete(id);
        logger.info("Category deleted", { categoryId: id });
        res.json({ success: true, message: "Category deleted successfully!" });
    } catch (error) {
        logger.error("Delete Category Error:", error);
        res.status(400).json({ success: false, error: "Invalid Category ID." });
    }
};

/**
 * ✅ PATCH: Partial update with optional image upload.
 * Allows partial updates. If a new image is provided, deletes the old image.
 */
export const updateCategoryPatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const newImage = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

        // Retrieve the current category document for modification.
        const categoryDoc = await Category.findById(id);
        if (!categoryDoc) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        // If a new title is provided, check for uniqueness.
        if (updateData.title && updateData.title !== categoryDoc.title) {
            const duplicate = await Category.findOne({
                title: updateData.title,
                _id: { $ne: id },
            })
                .select("_id")
                .lean();
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            categoryDoc.title = updateData.title;
        }

        // If a new image is provided, delete the old image file and update.
        if (newImage) {
            if (categoryDoc.image) {
                await deleteFile(categoryDoc.image);
            }
            categoryDoc.image = newImage;
        }

        const updatedCategory = await categoryDoc.save();
        logger.info("Category patched", { categoryId: updatedCategory._id });
        res.json({
            success: true,
            message: "Category updated successfully!",
            data: updatedCategory,
        });
    } catch (error) {
        logger.error("Update Category Patch Error:", error);
        res.status(400).json({ success: false, error: "Invalid update data." });
    }
};
