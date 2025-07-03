import SubCategory from "../models/SubCategory.js";
import TopCategory from "../models/TopCategory.js";
import fs from "fs";
import { SERVER_IMAGE_URL } from "../services/config.js";

// Logger
const logger = {
    info: (msg, meta) => console.info(msg, meta || ""),
    error: (msg, meta) => console.error(msg, meta || ""),
};

// File Deletion Utility
const deleteFile = async (filePath) => {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            logger.info(`Deleted file: ${filePath}`);
        }
    } catch (error) {
        logger.error(`Error deleting file ${filePath}:`, error);
    }
};

// ✅ Create SubCategory
export const createSubCategory = async (req, res) => {
    try {
        const { title, topCategory } = req.body;

        if (!title || !topCategory) {
            return res.status(400).json({ success: false, error: "Title and Top Category are required." });
        }

        const exists = await SubCategory.exists({ title });
        if (exists) {
            return res.status(400).json({ success: false, error: "SubCategory already exists." });
        }

        const validTopCategory = await TopCategory.findById(topCategory);
        if (!validTopCategory) {
            return res.status(400).json({ success: false, error: "Invalid TopCategory reference." });
        }

        const image = req.file ? `${SERVER_IMAGE_URL}/${req.file.path.replace(/\\/g, "/")}` : "";

        const subCategory = await SubCategory.create({ title, image, topCategory });
        res.status(201).json({ success: true, message: "SubCategory created successfully", data: subCategory });
    } catch (error) {
        logger.error("Create SubCategory Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

// ✅ Get All SubCategories
export const getSubCategories = async (req, res) => {
    try {
        const list = await SubCategory.find()
            .populate("topCategory", "title _id")
            .lean();
        res.json({ success: true, data: list });
    } catch (error) {
        logger.error("Get SubCategories Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

// ✅ Get Single SubCategory
export const getSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await SubCategory.findById(id).populate("topCategory", "title _id").lean();

        if (!sub) {
            return res.status(404).json({ success: false, error: "SubCategory not found." });
        }

        res.json({ success: true, data: sub });
    } catch (error) {
        logger.error("Get SubCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid SubCategory ID." });
    }
};

// ✅ Update SubCategory (PUT)
export const updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, topCategory } = req.body;
        const newImage = req.file ? `${SERVER_IMAGE_URL}/${req.file.path.replace(/\\/g, "/")}` : undefined;

        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ success: false, error: "SubCategory not found." });
        }

        if (title && title !== subCategory.title) {
            const exists = await SubCategory.findOne({ title, _id: { $ne: id } });
            if (exists) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            subCategory.title = title;
        }

        if (topCategory && topCategory !== String(subCategory.topCategory)) {
            const valid = await TopCategory.findById(topCategory);
            if (!valid) {
                return res.status(400).json({ success: false, error: "Invalid TopCategory reference." });
            }
            subCategory.topCategory = topCategory;
        }

        if (newImage) {
            if (subCategory.image) {
                const localPath = subCategory.image.replace(SERVER_IMAGE_URL + "/", "");
                await deleteFile(localPath);
            }
            subCategory.image = newImage;
        }

        const updated = await subCategory.save();
        res.json({ success: true, message: "SubCategory updated successfully", data: updated });
    } catch (error) {
        logger.error("Update SubCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid update data." });
    }
};

// ✅ Patch SubCategory
export const patchSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const newImage = req.file ? `${SERVER_IMAGE_URL}/${req.file.path.replace(/\\/g, "/")}` : undefined;

        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ success: false, error: "SubCategory not found." });
        }

        if (updates.title && updates.title !== subCategory.title) {
            const duplicate = await SubCategory.findOne({ title: updates.title, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            subCategory.title = updates.title;
        }

        if (updates.topCategory && updates.topCategory !== String(subCategory.topCategory)) {
            const valid = await TopCategory.findById(updates.topCategory);
            if (!valid) {
                return res.status(400).json({ success: false, error: "Invalid TopCategory reference." });
            }
            subCategory.topCategory = updates.topCategory;
        }

        if (newImage) {
            if (subCategory.image) {
                const localPath = subCategory.image.replace(SERVER_IMAGE_URL + "/", "");
                await deleteFile(localPath);
            }
            subCategory.image = newImage;
        }

        const updated = await subCategory.save();
        res.json({ success: true, message: "SubCategory patched successfully", data: updated });
    } catch (error) {
        logger.error("Patch SubCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid patch data." });
    }
};

// ✅ Delete SubCategory
export const deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ success: false, error: "SubCategory not found." });
        }

        if (subCategory.image) {
            const localImagePath = subCategory.image.replace(SERVER_IMAGE_URL + "/", "");
            await deleteFile(localImagePath);
        }

        await SubCategory.findByIdAndDelete(id);
        res.json({ success: true, message: "SubCategory deleted successfully" });
    } catch (error) {
        logger.error("Delete SubCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid SubCategory ID." });
    }
};
