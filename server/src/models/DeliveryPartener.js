import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    tshirtSize: { type: String, enum: ["S", "M", "L", "XL", "XXL"] },
    state: { type: String },

    profileImageUrl: { type: String },

    aadharDetails: {
      aadharNumber: {
        type: String,
        required: true,
        match: /^\d{12}$/,
      },
      aadharName: { type: String, required: true },
      aadharImage: { type: String },
    },

    panDetails: {
      panNumber: {
        type: String,
        required: true,
        match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      },
      panName: { type: String, required: true },
      panImage: { type: String },
    },

    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[6-9]\d{9}$/,
      index: true,
    },

    vehicleType: { type: String, required: true },
    city: { type: String, required: true },
    branch: { type: String, required: true },

    rank: {
      type: String,
      enum: ["Bronze", "Platinum", "Diamond"],
      default: "Bronze",
    },

    wallet: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    onlineStatus: { type: Boolean, default: false },

    withdrawalDetails: {
      selectedPrimaryMethod: {
        type: String,
        enum: ["upi", "bank"],
        required: true,
      },
      upiId: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankAccountName: { type: String },
      bankName: { type: String },
    },
    
    onboardingStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, // e.g., pending/approved/rejected
    assignedBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise" },
  },
  { timestamps: true }
);

// deliveryPartnerSchema.index({ mobileNumber: 1 }, { unique: true });
deliveryPartnerSchema.index({ aadharDetails: { aadharNumber: 1 } }, { unique: true });
deliveryPartnerSchema.index({ panDetails: { panNumber: 1 } }, { unique: true });

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema);
