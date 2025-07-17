import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Brand title is required"],
            trim: true,
            unique: true,
            maxlength: [100, "Brand title cannot exceed 100 characters"],
            index: true,
        },
        image: {
            type: String,
            required: [true, "Brand image is required"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Add text index for search functionality
BrandSchema.index({ title: 'text' });

export default mongoose.model("Brand", BrandSchema);