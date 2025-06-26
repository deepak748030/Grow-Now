import Category from "../models/Category.js";
import fs from "fs";
import path from "path";
import { SERVER_IMAGE_URL } from "../services/config.js";

// Logger
const logger = {
    info: (msg, meta) => console.info(msg, meta || ""),
    error: (msg, meta) => console.error(msg, meta || ""),
};

// Delete file if exists
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

// ✅ Create Category
export const createCategory = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, error: "Title is required." });
        }

        const existingCategory = await Category.exists({ title });
        if (existingCategory) {
            return res.status(400).json({ success: false, error: "Category already exists." });
        }

        const image = req.file ? `${SERVER_IMAGE_URL}/${req.file.path.replace(/\\/g, "/")}` : "";

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

// ✅ Get All Categories
export const getCategories = async (req, res) => {
    try {
        logger.info("Cache miss for categories, fetching from database");
        const categories = await Category.find({}, "_id title image").lean();
        res.json({ success: true, data: categories });
    } catch (error) {
        logger.error("Get Categories Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

// ✅ Get Single Category
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

// ✅ Update Category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const newImage = req.file ? `${SERVER_IMAGE_URL}/${req.file.path.replace(/\\/g, "/")}` : undefined;

        const categoryDoc = await Category.findById(id);
        if (!categoryDoc) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        if (title && title !== categoryDoc.title) {
            const duplicate = await Category.findOne({ title, _id: { $ne: id } }).select("_id").lean();
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            categoryDoc.title = title;
        }

        if (newImage) {
            if (categoryDoc.image) {
                const localImagePath = categoryDoc.image.replace(SERVER_IMAGE_URL + "/", "");
                await deleteFile(localImagePath);
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

// ✅ Delete Category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        if (category.image) {
            const localImagePath = category.image.replace(SERVER_IMAGE_URL + "/", "");
            await deleteFile(localImagePath);
        }

        await Category.findByIdAndDelete(id);
        logger.info("Category deleted", { categoryId: id });
        res.json({ success: true, message: "Category deleted successfully!" });
    } catch (error) {
        logger.error("Delete Category Error:", error);
        res.status(400).json({ success: false, error: "Invalid Category ID." });
    }
};

// ✅ Patch Category
export const updateCategoryPatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const newImage = req.file ? `${SERVER_IMAGE_URL}/${req.file.path.replace(/\\/g, "/")}` : undefined;

        const categoryDoc = await Category.findById(id);
        if (!categoryDoc) {
            return res.status(404).json({ success: false, error: "Category not found." });
        }

        if (updateData.title && updateData.title !== categoryDoc.title) {
            const duplicate = await Category.findOne({ title: updateData.title, _id: { $ne: id } }).select("_id").lean();
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            categoryDoc.title = updateData.title;
        }

        if (newImage) {
            if (categoryDoc.image) {
                const localImagePath = categoryDoc.image.replace(SERVER_IMAGE_URL + "/", "");
                await deleteFile(localImagePath);
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
