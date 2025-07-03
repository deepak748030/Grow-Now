import TopCategory from "../models/TopCategory.js";
import Category from "../models/Category.js";

// Logger
const logger = {
    info: (msg, meta) => console.info(msg, meta || ""),
    error: (msg, meta) => console.error(msg, meta || ""),
};

// ✅ Create TopCategory
export const createTopCategory = async (req, res) => {
    try {
        const { title, category } = req.body;
        if (!title || !category) {
            return res.status(400).json({ success: false, error: "Title and Category are required." });
        }

        const exists = await TopCategory.exists({ title });
        if (exists) {
            return res.status(400).json({ success: false, error: "Top Category already exists." });
        }

        const isValidCategory = await Category.findById(category).lean();
        if (!isValidCategory) {
            return res.status(404).json({ success: false, error: "Invalid Category reference." });
        }

        const newTopCategory = await TopCategory.create({ title, category });
        logger.info("Top Category created", { id: newTopCategory._id });
        res.status(201).json({ success: true, message: "Top Category created successfully", data: newTopCategory });
    } catch (error) {
        logger.error("Create Top Category Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

// ✅ Get All TopCategories
export const getTopCategories = async (req, res) => {
    try {
        const topCategories = await TopCategory.find()
            .populate("category", "_id title") // populate category title
            .lean();
        res.json({ success: true, data: topCategories });
    } catch (error) {
        logger.error("Get TopCategories Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error." });
    }
};

// ✅ Get Single TopCategory
export const getTopCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const topCategory = await TopCategory.findById(id)
            .populate("category", "_id title")
            .lean();

        if (!topCategory) {
            return res.status(404).json({ success: false, error: "Top Category not found." });
        }

        res.json({ success: true, data: topCategory });
    } catch (error) {
        logger.error("Get TopCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid TopCategory ID." });
    }
};

// ✅ Update TopCategory (PUT)
export const updateTopCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category } = req.body;

        const topCategory = await TopCategory.findById(id);
        if (!topCategory) {
            return res.status(404).json({ success: false, error: "Top Category not found." });
        }

        if (title && title !== topCategory.title) {
            const duplicate = await TopCategory.findOne({ title, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            topCategory.title = title;
        }

        if (category && category !== String(topCategory.category)) {
            const isValid = await Category.findById(category);
            if (!isValid) {
                return res.status(400).json({ success: false, error: "Invalid Category reference." });
            }
            topCategory.category = category;
        }

        const updated = await topCategory.save();
        res.json({ success: true, message: "Top Category updated successfully", data: updated });
    } catch (error) {
        logger.error("Update TopCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid update data." });
    }
};

// ✅ Patch TopCategory
export const patchTopCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const topCategory = await TopCategory.findById(id);
        if (!topCategory) {
            return res.status(404).json({ success: false, error: "Top Category not found." });
        }

        if (updateData.title && updateData.title !== topCategory.title) {
            const duplicate = await TopCategory.findOne({ title: updateData.title, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({ success: false, error: "Title already exists." });
            }
            topCategory.title = updateData.title;
        }

        if (updateData.category && updateData.category !== String(topCategory.category)) {
            const isValid = await Category.findById(updateData.category);
            if (!isValid) {
                return res.status(400).json({ success: false, error: "Invalid Category reference." });
            }
            topCategory.category = updateData.category;
        }

        const updated = await topCategory.save();
        res.json({ success: true, message: "Top Category patched successfully", data: updated });
    } catch (error) {
        logger.error("Patch TopCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid patch data." });
    }
};

// ✅ Delete TopCategory
export const deleteTopCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const topCategory = await TopCategory.findById(id);
        if (!topCategory) {
            return res.status(404).json({ success: false, error: "Top Category not found." });
        }

        await TopCategory.findByIdAndDelete(id);
        res.json({ success: true, message: "Top Category deleted successfully" });
    } catch (error) {
        logger.error("Delete TopCategory Error:", error);
        res.status(400).json({ success: false, error: "Invalid ID." });
    }
};
