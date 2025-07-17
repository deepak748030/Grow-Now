import Product from '../models/Product.js';
import { SERVER_IMAGE_URL } from '../services/config.js';

export const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            topCategory,
            subCategory,
            tag,
            types,
            brand,
            creatorId,
        } = req.body;

        if (
            !title || !description || !topCategory || !subCategory ||
            !types || !req.files
        ) {
            return res.status(400).json({ success: false, error: "All required fields are missing or invalid" });
        }

        // Parse types and assign images
        const parsedTypes = JSON.parse(types);
        const images = req.files.map(file => `${SERVER_IMAGE_URL}/uploads/${file.filename}`);

        // Assign images to variants
        const typesWithImages = parsedTypes.map((type, index) => ({
            ...type,
            imageUrl: images[index] || '' // Assign image to each variant
        }));

        const productStatus = creatorId ? 'pending' : 'success';

        const newProduct = new Product({
            title,
            description,
            category: category || null,
            topCategory,
            subCategory,
            brand: brand || null,
            tag: tag ? JSON.parse(tag) : [],
            types: typesWithImages,
            status: productStatus,
            creatorId: creatorId || null,
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: "Product created successfully", data: newProduct });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            topCategory,
            subCategory,
            brand,
            tag,
            types,
        } = req.body;

        if (!title || !description || !topCategory || !subCategory) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const updateData = {
            title,
            description,
            category: category || null,
            topCategory,
            subCategory,
            brand: brand || null,
            tag: tag ? JSON.parse(tag) : [],
        };

        if (types) {
            try {
                const parsedTypes = JSON.parse(types);

                if (req.files && req.files.length > 0) {
                    // New images uploaded
                    const images = req.files.map(file => `${SERVER_IMAGE_URL}/uploads/${file.filename}`);
                    updateData.types = parsedTypes.map((type, index) => ({
                        ...type,
                        imageUrl: images[index] || type.imageUrl || ''
                    }));
                } else {
                    // No new images, keep existing
                    updateData.types = parsedTypes;
                }
            } catch (e) {
                return res.status(400).json({ success: false, error: "Invalid types JSON" });
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) return res.status(404).json({ success: false, error: 'Product not found' });

        res.status(200).json({ success: true, message: "Product updated successfully", data: updatedProduct });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Add search endpoint
export const searchProducts = async (req, res) => {
    try {
        const { q, category } = req.query;
        let filter = {};

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        if (category && category !== '') {
            filter.category = category;
        }

        const products = await Product.find(filter).sort({ createdAt: -1 })
            .populate('category topCategory subCategory brand')
            .select('-__v');

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllProducts = async (_req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 })
            .populate('category topCategory subCategory brand')
            .select('-__v');
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category topCategory subCategory brand');
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, error: "Product not found" });

        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getProductsByCreator = async (req, res) => {
    try {
        const { creatorId } = req.params;
        if (!creatorId) return res.status(400).json({ success: false, error: "creatorId is required" });

        const products = await Product.find({ creatorId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: products.length, data: products });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["pending", "success", "failed"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
            });
        }

        const updated = await Product.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ success: false, error: "Product not found" });

        res.status(200).json({
            success: true,
            message: `Status updated to '${status}'`,
            data: updated,
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
