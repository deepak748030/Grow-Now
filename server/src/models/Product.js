import mongoose from "mongoose";

// Define the ProductVariants schema
const ProductVariantsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Variant title is required"],
        trim: true,
        index: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be a positive number"],
        index: true,
    },
    withoutDiscountPrice: {
        type: Number,
        required: [true, "Without discount price is required"],
        min: [0, "Without discount price must be a positive number"],
        index: true,
    },
    smallDescription: {
        type: String,
        required: [true, "Small description is required"],
        maxlength: [200, "Small description cannot exceed 200 characters"],
    },
});

// Define the Product schema
const ProductSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Product title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            index: true,
        },
        stock: {
            type: Number,
            default: 0,
            min: [0, "Stock cannot be negative"],
            index: true,
        },
        weightOrCount: {
            type: String,
            required: [true, "Weight or count is required"],
        },
        tag: {
            type: [String],
            default: []
        },
        imageUrl: {
            type: [String],
            default: []
        },
        types: {
            type: [ProductVariantsSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Export the Product model
export default mongoose.model("Product", ProductSchema);
