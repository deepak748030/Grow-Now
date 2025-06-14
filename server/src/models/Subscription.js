import mongoose from "mongoose";

// Define the SubscriptionTypes schema
const SubscriptionTypesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Subscription type title is required"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be a positive number"],
    },
    withoutDiscountPrice: {
        type: Number,
        required: [true, "Without discount price is required"],
        min: [0, "Without discount price must be a positive number"],
    },
    smallDescription: {
        type: String,
        required: [true, "Small description is required"],
        maxlength: [200, "Small description cannot exceed 200 characters"],
    },
});

// Define the Subscription schema
const SubscriptionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
    },
    franchiseIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Franchise",
        default: [],
        // required: [true, "Franchise IDs are required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    category: {
        type: String,
        required: [true, "Category is required"],
    },
    weightOrCount: {
        type: String,
        required: [true, "Weight or count is required"],
    },
    tag: {
        type: String
    },
    imageUrl: {
        type: [String],
        default: []
    },
    types: {
        type: [SubscriptionTypesSchema],
        default: [],
    },
}, {
    timestamps: true,
    versionKey: false,
});

// Export the Subscription model
export default mongoose.model("Subscription", SubscriptionSchema);
