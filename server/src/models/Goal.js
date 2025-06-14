import mongoose from "mongoose";

// Define the Goal schema
const GoalSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Goal title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
            index: true,
        },
        imageUrl: {
            type: String,
            // required: [true, "Image URL is required"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Export the Goal model
export default mongoose.model("Goal", GoalSchema);
