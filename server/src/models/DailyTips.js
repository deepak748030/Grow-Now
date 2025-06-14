import mongoose from "mongoose";

// Define the DailyTips schema
const DailyTipsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
            index: true,
        },
        imageUrl: {
            type: String,
            required: [true, "Image URL is required"],
        },
        subscription: {
            type: String
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Export the DailyTips model
export default mongoose.model("DailyTips", DailyTipsSchema);
