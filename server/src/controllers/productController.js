import Product from '../models/Product.js';
import { SERVER_IMAGE_URL } from '../services/config.js';
// import redis from '../redis/redisClient.js'

export const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            stock,
            weightOrCount,
            tag,
            types,
            mainImageIndex,
            topCategory,
            subCategory,
            creatorId, // ✅ optionally passed
        } = req.body;

        if (
            !title ||
            !description ||
            !category ||
            !weightOrCount ||
            !types ||
            !req.files ||
            mainImageIndex === undefined
        ) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const images = req.files.map((file) => {
            if (!file || !file.filename) {
                throw new Error("Invalid file upload");
            }
            return `${SERVER_IMAGE_URL}/uploads/${file.filename}`;
        });

        if (mainImageIndex < 0 || mainImageIndex >= images.length) {
            return res.status(400).json({ error: "Invalid mainImageIndex" });
        }

        const mainImage = images[mainImageIndex];
        images.splice(mainImageIndex, 1);
        images.unshift(mainImage); // Ensure main image is first

        const newProduct = new Product({
            title,
            description,
            category,
            stock,
            weightOrCount,
            tag,
            topCategory,
            subCategory,
            imageUrl: images,
            types: JSON.parse(types),
            status: "pending", // ✅ always "pending" on creation
            creatorId: creatorId || null, // ✅ optional if passed
        });

        await newProduct.save();
        res.status(201).json({
            message: "Product created successfully",
            data: newProduct,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// ✅ Get All Products
export const getAllProducts = async (_req, res) => {
    try {
        // const cacheProducts = await redis.get('products');
        // if (cacheProducts) {
        //     console.log("first");
        //     return res.status(200).json({ success: true, data: JSON.parse(cacheProducts) });
        // }
        const products = await Product.find().sort({ createdAt: -1 })
            .populate('category')
            .select('-createdAt -updatedAt');
        // await redis.set('products', JSON.stringify(products), 'EX', 3600); // Cache for 1 hour
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get Product by ID
export const getProductById = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error)
    }
};


export const updateProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            stock,
            weightOrCount,
            tag,
            types,
            mainImageIndex,
            topCategory,
            subCategory,
        } = req.body;

        // ✅ Validate required fields
        if (!title || !description || !category || !weightOrCount || mainImageIndex === undefined) {
            return res.status(400).json({
                success: false,
                error: "All required fields must be provided",
            });
        }

        // ✅ Build the update payload
        const updateData = {
            title,
            description,
            category,
            stock,
            weightOrCount,
            tag,
            topCategory,
            subCategory,
        };

        // ✅ Handle image update
        if (req.files && req.files.length > 0) {
            const images = req.files.map((file) => {
                if (!file || !file.filename) {
                    throw new Error("Invalid file upload");
                }
                return `${SERVER_IMAGE_URL}/uploads/${file.filename}`;
            });

            if (mainImageIndex < 0 || mainImageIndex >= images.length) {
                return res.status(400).json({ success: false, error: "Invalid mainImageIndex" });
            }

            // Ensure main image is first
            const mainImage = images[mainImageIndex];
            images.splice(mainImageIndex, 1);
            images.unshift(mainImage);

            updateData.imageUrl = images;
        }

        // ✅ Handle types update
        if (types) {
            try {
                updateData.types = JSON.parse(types);
            } catch (e) {
                return res.status(400).json({ success: false, error: "Invalid types JSON format" });
            }
        }

        // ✅ Update the product
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedProduct) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// ✅ Delete Product
export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ error: 'Product not found' });
        // await redis.del('products'); // Invalidate the cache for products
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getProductsByCreator = async (req, res) => {
    try {
        const { creatorId } = req.params;

        if (!creatorId) {
            return res.status(400).json({ success: false, error: "creatorId is required" });
        }

        const products = await Product.find({ creatorId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};