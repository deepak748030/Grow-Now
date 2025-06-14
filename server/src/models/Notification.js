import mongoose from "mongoose";

// Define the Notification schema with optimized validation and indexing
const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        minlength: [3, "Title must be at least 3 characters long"],
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    seen_status: {
        type: Boolean,
        default: false,
        index: true // Index for faster retrieval of unseen notifications
    },
    type: {
        type: String,
        enum: ["sub-order", "product-order", "addmoney", "withdraw", "news", "promotion"],
        required: [true, "Notification type is required"],
        index: true // Index to speed up searches based on type
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MyProductOrders",
        default: null // Default to null if no order is associated
    }
}, { timestamps: true, versionKey: false });

// Compound Index for faster filtering (seen_status + type)
NotificationSchema.index({ seen_status: 1, type: 1 });

// Export the optimized Notification model
export default mongoose.model("Notification", NotificationSchema);
