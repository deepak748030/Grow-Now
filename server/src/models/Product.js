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
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        topCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TopCategory",
            required: [true, "Top Category reference is required"],
        },
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
            required: [true, "Sub Category reference is required"],
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
        // ✅ New: Status field
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
        },

        // ✅ New: Creator ID field
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Export the Product model
export default mongoose.model("Product", ProductSchema);
