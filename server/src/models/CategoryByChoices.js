import mongoose from "mongoose";

// Define the optimized Category schema
const CategoryChoiceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            unique: true, // ✅ Unique fields are indexed automatically
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"]
        },
        image: {
            type: String,
            trim: true,
            default: "" // Default to an empty string if no image is provided
        },
        types: {
            type: String,
            enum: ["product", "subscription"],
            default: "product"
        },
        productId: {
            type: String,
            default: ""
        },
        category: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt
        versionKey: false // Remove __v field from documents
    }
);

// Export the optimized Category model
export default mongoose.model("CategoryByChoices", CategoryChoiceSchema);
