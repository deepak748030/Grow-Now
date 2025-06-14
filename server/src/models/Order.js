import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true // ✅ Faster user-specific lookups
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, "Quantity must be at least 1"]
                },
                priceAtPurchase: {
                    type: Number,
                    required: true
                }
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
            default: "placed",
            index: true // ✅ Faster status-based queries
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
            index: true // ✅ Fast payment-related queries
        },
        paymentMethod: {
            type: String,
            enum: ["cod", "credit_card", "upi", "net_banking"],
            required: true
        },
        deliveryDate: {
            type: Date
        },
        deliveryPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        deliveryDateTime: {
            type: Date
        },
        rating: {
            type: Number,
            min: [0, "Rating must be at least 0"],
            max: [5, "Rating cannot exceed 5"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"]
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// ✅ Optimize indexing for high-performance queries
OrderSchema.index({ user: 1, status: 1, paymentStatus: 1 });
OrderSchema.index({ deliveryDate: 1 });

export default mongoose.model("Order", OrderSchema);
