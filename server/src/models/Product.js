import mongoose from "mongoose";

// Define the ProductVariants schema
const ProductVariantsSchema = new mongoose.Schema({
    weightCountOrAny: {
        type: String,
        required: [true, "Weight/Count/Variant title is required"],
        trim: true,
        index: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be a positive number"],
        index: true,
    },
    mrp: {
        type: Number,
        required: [true, "MRP is required"],
        min: [0, "MRP must be a positive number"],
        index: true,
    },
    tag: {
        type: String,
        required: [true, "Tag is required"],
        maxlength: [200, "Tag cannot exceed 200 characters"],
    },
    imageUrl: {
        type: String,
        // required: [true, "Variant image is required"],
    },
    stock: {
        type: Number,
        required: true,
        min: [0, "Stock cannot be negative"],
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
        brand: {
            type: String,
            // ref: "Brand",
            default: null,
        },
        tag: {
            type: [String],
            default: []
        },
        types: {
            type: [ProductVariantsSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: "Vendor",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Export the Product model
export default mongoose.model("Product", ProductSchema);
