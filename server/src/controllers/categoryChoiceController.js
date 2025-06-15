import CategoryByChoices from "../models/CategoryByChoices.js";
import fs from "fs";
import { SERVER_IMAGE_URL } from "../services/config.js";
// import redis from '../redis/redisClient.js'


// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { title, type, productId, category, types } = req.body;
        const image = req.file ? req.file.path : "";

        const categoryData = await CategoryByChoices.create({ title, type, productId, category, image, types });
        // await redis.del("categories"); // Clear the cache after creating a new category
        res.status(201).json({ success: true, data: categoryData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        // const cacheCategories = await redis.get("categories");
        if (cacheCategories) {
            return res.status(200).json({ success: true, data: JSON.parse(cacheCategories) });
        }
        const categories = await CategoryByChoices.find();
        // await redis.set("categories", JSON.stringify(categories), "EX", 3600);
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
    try {
        const category = await CategoryByChoices.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a category by ID
export const updateCategory = async (req, res) => {
    try {
        const { title, types, productId, category } = req.body;
        const image = req.file ? `${SERVER_IMAGE_URL}/${req.file.path}` : undefined;

        const updateData = image ? { title, types, productId, category, image } : { title, types, productId, category };

        const categoryData = await CategoryByChoices.findById(req.params.id);
        if (!categoryData) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Delete old image if a new image is uploaded
        if (image && categoryData.image) {
            try {
                fs.unlinkSync(categoryData.image.replace(SERVER_IMAGE_URL, ""));
            } catch (err) {
                console.error("Error deleting old image:", err.message);
            }
        }

        const updatedCategory = await CategoryByChoices.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });
        // await redis.del("categories"); // Clear the cache after creating a new category
        res.status(200).json({ success: true, data: updatedCategory });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete a category by ID
export const deleteCategory = async (req, res) => {
    try {
        const category = await CategoryByChoices.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Delete image file if it exists
        if (category.image) {
            fs.unlinkSync(category.image);
        }

        await CategoryByChoices.findByIdAndDelete(req.params.id);
        // await redis.del("categories"); // Clear the cache after creating a new category
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};