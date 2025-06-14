import mongoose from "mongoose";

// Define the DeliveryPreferences schema
const DeliveryPreferencesSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
        index: true // Index for faster lookups
    },
    callBeforeDelivery: {
        type: Boolean,
        default: false
    },
    ringTheBell: {
        type: Boolean,
        default: false
    },
    doorImage: {
        type: String,
        trim: true,
        maxlength: [255, "Door image URL cannot exceed 255 characters"]
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"]
    }
}, {
    timestamps: true,
    versionKey: false // Remove `__v` field
});

// Export the optimized DeliveryPreferences model
export default mongoose.model("DeliveryPreferences", DeliveryPreferencesSchema);
