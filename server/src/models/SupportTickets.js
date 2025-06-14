import mongoose from "mongoose";

// Define the SupportTickets schema
const SupportTicketsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            // required: [true, "Title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"], // Restrict title length
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"], // Restrict description length
        },
        type: {
            type: String,
            enum: [
                "AddMoney",
                "Withdraw",
                "Refund",
                "Cashback",
                "Product",
                "Subscription",
                "Delivery",
                "debit",
                "Other",
            ],
            required: [true, "Ticket type is required"],
        },
        status: {
            type: String,
            enum: ["pending", "in progress", "resolved", "closed", "completed"], // Defined ticket statuses
            default: "pending",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true, // Optimized index for faster queries
        },
        orderIdOrTrxId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: false, // Optional reference to order or transaction
        },
    },
    { timestamps: true, versionKey: false } // Remove __v field for clean data
);

// Create optimized indexes for frequent queries
SupportTicketsSchema.index({ userId: 1, status: 1 });
SupportTicketsSchema.index({ type: 1 });

// Export the SupportTickets model
export default mongoose.model("SupportTicket", SupportTicketsSchema);
