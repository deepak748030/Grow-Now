import mongoose from "mongoose";

const ProductOrdersSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true,
        // index: true
    },
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryPartner",
    },
    productData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    selectedType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Delivered", "Failed", "Delayed", "Cancelled", "Delivered",],
        default: "Pending"
    },
    deliveryDate: {
        type: String,
        default: ""
    },
    orderDate: {
        type: Date,
        required: true
    },
    orderTimeStamps: {
        type: Number,
        default: () => Date.now()
    },
    paymentMethod: {
        type: String,
        default: "Cash on Delivery"
    },
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
        required: true
    },
    amountEarnedByDeliveryPartner: { type: Number },
}, { timestamps: true, versionKey: false });

export default mongoose.model("ProductOrders", ProductOrdersSchema);
