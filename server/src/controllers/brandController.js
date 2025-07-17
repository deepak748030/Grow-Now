import Brand from '../models/Brand.js';
import { SERVER_IMAGE_URL } from '../services/config.js';

export const createBrand = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || !req.file) {
            return res.status(400).json({
                success: false,
                error: "Title and image are required"
            });
        }

        // Check if brand with same title already exists
        const existingBrand = await Brand.findOne({ title: title.trim() });
        if (existingBrand) {
            return res.status(400).json({
                success: false,
                error: "Brand with this title already exists"
            });
        }

        const imageUrl = `${SERVER_IMAGE_URL}/uploads/${req.file.filename}`;

        const newBrand = new Brand({
            title: title.trim(),
            image: imageUrl,
        });

        await newBrand.save();
        res.status(201).json({
            success: true,
            message: "Brand created successfully",
            data: newBrand
        });

    } catch (error) {
        console.error("Create brand error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: "Brand with this title already exists"
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllBrands = async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        let filter = {};

        // Add search functionality
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const brands = await Brand.find(filter)
            .sort({ title: 1 }) // Sort alphabetically
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const total = await Brand.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: brands,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error("Get brands error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getBrandById = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                error: 'Brand not found'
            });
        }

        res.status(200).json({ success: true, data: brand });
    } catch (error) {
        console.error("Get brand by ID error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid brand ID format'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateBrand = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: "Title is required"
            });
        }

        // Check if another brand with same title exists (excluding current brand)
        const existingBrand = await Brand.findOne({
            title: title.trim(),
            _id: { $ne: req.params.id }
        });

        if (existingBrand) {
            return res.status(400).json({
                success: false,
                error: "Brand with this title already exists"
            });
        }

        const updateData = {
            title: title.trim(),
        };

        // Update image if new one is uploaded
        if (req.file) {
            updateData.image = `${SERVER_IMAGE_URL}/uploads/${req.file.filename}`;
        }

        const updatedBrand = await Brand.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedBrand) {
            return res.status(404).json({
                success: false,
                error: 'Brand not found'
            });
        }

        res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: updatedBrand
        });

    } catch (error) {
        console.error("Update brand error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid brand ID format'
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: "Brand with this title already exists"
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteBrand = async (req, res) => {
    try {
        const deletedBrand = await Brand.findByIdAndDelete(req.params.id);

        if (!deletedBrand) {
            return res.status(404).json({
                success: false,
                error: "Brand not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Brand deleted successfully",
            data: deletedBrand
        });
    } catch (error) {
        console.error("Delete brand error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid brand ID format'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const searchBrands = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: "Search query is required"
            });
        }

        const brands = await Brand.find({
            title: { $regex: q, $options: 'i' }
        })
            .sort({ title: 1 })
            .limit(20)
            .select('-__v');

        res.status(200).json({
            success: true,
            data: brands
        });
    } catch (error) {
        console.error("Search brands error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};