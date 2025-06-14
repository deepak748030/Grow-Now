import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
    maintenance: {
        type: Boolean,
        default: false,
    },

    links: {
        website: {
            type: String,
            trim: true,
            maxlength: 255,
            match: [/^https?:\/\/.+/, "Invalid website URL"],
        },
        about: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        privacy: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        termsAndConditions: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        thirdPartyLicense: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        refundAndCancelation: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        shippingPolicy: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },

    rechargeOptions: [
        {
            amount: {
                type: Number,
                required: true,
                min: 1,
            },
            cashback: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
    ],

    minAddMoney: {
        type: Number,
        default: 1,
        min: 1,
    },

    maxRefers: {
        type: Number,
        default: 0,
        min: 0,
    },

    referReward: {
        type: Number,
        default: 0,
        min: 0,
    },

    deliveryTiming: {
        type: String,
        default: "5:00 AM to 8:30 PM",
        maxlength: 50,
    },

    maxSubscriptionUpdateOrCancelTime: {
        type: String,
        default: "8:30 PM",
        maxlength: 10,
    },

    // Base64 image strings
    bottomImage: {
        type: String, // Store as base64 string
        default: "",
    },
    referImage: {
        type: String,
        default: "",
    },
    referPageImageAttachment: {
        type: String,
        default: "",
    },
    healthyBanner: {
        type: String,
        default: "",
    },
    searchBackgroundImage: {
        type: String,
        default: "",
    },
    topBannerImage: {
        type: String,
        default: "",
    },
    platformFees: {
        type: Number,
        default: 0,
        min: 0,
    }
}, {
    timestamps: true,
    versionKey: false,
});

SettingSchema.index({ maintenance: 1 });
SettingSchema.index({ "links.website": 1 });

export default mongoose.model("Setting", SettingSchema);
