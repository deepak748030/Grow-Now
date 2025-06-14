import mongoose from "mongoose";

// Define the Transaction schema
const TransactionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"]
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount must be a positive number"]
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: [true, "Transaction type is required"]
        },
        category: {
            type: String,
            enum: ["addmoney", "subscription", "product", "refund", "cashback", "referral"],
            required: [true, "Transaction category is required"]
        },
        status: {
            type: String,
            enum: ["pending", "failed", "success"],
            default: "pending"
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // required: [true, "User ID is required"]
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// 🔹 **Indexes for Faster Query Performance**
TransactionSchema.index({ title: 1 }, { unique: false });
TransactionSchema.index({ amount: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ category: 1 });

// Export the Optimized Transaction model
const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;
