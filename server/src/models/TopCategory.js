import mongoose from "mongoose";

const TopCategorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category reference is required"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model("TopCategory", TopCategorySchema);
