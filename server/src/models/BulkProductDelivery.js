import mongoose from "mongoose";

const BulkDeliverySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Recipient name is required"],
            trim: true,
        },
        address: {
            type: String,
            required: [true, "Address is required"],
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
        },
        deliveryDate: {
            type: Date,
            required: [true, "Delivery date is required"],
        },
        imageUrl: {
            type: String,
            required: [true, "Image is required"],
        },
        status: {
            type: String,
            enum: ["pending", "delivered", "cancelled"],
            default: "pending",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model("BulkDelivery", BulkDeliverySchema);
