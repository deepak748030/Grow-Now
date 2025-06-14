import mongoose from "mongoose";

// Define Order Schema
const SubscriptionOrdersSchema = new mongoose.Schema(
    {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        location: { type: String, required: true },
        finalAmount: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        paymentType: {
            type: String, enum: ["COD", "ONLINE", "FAILED"],
            defaut: "ONLINE"
        }, // Added paymentType
        orders: [
            {
                amount: { type: Number, required: true },
                subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
                startDate: { type: Date, required: true },
                selectedType: { type: Number, required: true }, // Changed to Number
                days: { type: String, enum: ["mon-fri", "mon-sat"], required: true }, // Added days field
                remainingDays: { type: Number, required: true },
                deliveryDates: [
                    {
                        date: { type: String, required: true },
                        status: { type: String, default: "Pending" },
                        description: { type: String },
                        deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" },
                        deliveryTime: { type: String },
                        rating: { type: Number, min: 0, max: 5, default: 0 },
                        deliveryImage: { type: String },
                        amountEarnedByDeliveryPartner: { type: Number },
                        isBoxCollected: { type: Boolean, default: false },
                        IsBoxCleaned: { type: Boolean, default: false },
                    },
                ],
            },
        ],
        location: {
            address: {
                type: String,
                required: true
            },
            locationLat: {
                type: Number,
                required: true
            },
            locationLng: {
                type: Number,
                required: true
            },
            locationType: {
                type: String,
                enum: ["home", "work", "other"],
                default: "home",
            },
            flatNumber: {
                type: String,
                default: ""
            },
            buildingName: {
                type: String,
                default: ""
            },
            floor: {
                type: String,
                default: ""
            },
            landmark: {
                type: String,
                default: ""
            },
        },
        // pausedDates: [
        //     {
        //       date: { type: Date },
        //       pausedAt: { type: Date, default: Date.now }
        //     }
        // ],
        subscriptionStatus: { type: String, enum: ["Active", "Inactive", "Cancelled"], default: "Active" },
        gstAmount: {
            type: Number,
            default: 0
        },
        deliveryFees: {
            type: Number,
            default: 0
        },
        platformFees: {
            type: Number,
            default: 0
        },
        bonusUsed: {
            type: Number,
            default: 0
        },
        assignedFranchiseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Franchise",
            // required: true
        },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("SubscriptionOrder", SubscriptionOrdersSchema);
