import mongoose from "mongoose";

// Define the user schema with maximum optimization
const userSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
      trim: true,
      index: true, // Ensures fast search
    },
    name: {
      type: String,
      // required: [true, "Name is required"],
      // minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [20, "Name cannot exceed 20 characters"],
      trim: true,
      index: true,
      default: "",
    },
    alternateMobile: {
      type: String,
      match: [/^\d{10}$/, "Alternate mobile number must be exactly 10 digits"],
      trim: true,
    },
    email: {
      type: String,
      // required: [true, "Email is required"],
      unique: true,
      sparse: true, // Allows multiple nulls while ensuring uniqueness for actual values
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      trim: true,
      index: true,
    },
    profilePicture: {
      type: String,
      minlength: [5, "Profile picture URL must be at least 5 characters long"],
      trim: true,
    },
    dob: {
      type: Date,
      validate: {
        validator: function (value) {
          return value <= new Date(); // Ensures date is not in the future
        },
        message: "Date of birth cannot be in the future",
      },
    },
    fcmToken: {
      type: String,
      unique: true,
      sparse: true, // Ensures uniqueness only for non-null values
      index: true,
    },
    wallet: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"], // Prevents negative values
    },
    referCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    referredUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        earnedCredit: {
          type: Number,
          default: 0,
        },
        _id: false, // This will prevent the automatic creation of _id for each subdocument
      },
    ],
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bonusWallet: {
      type: Number,
      default: 0,
      min: [0, "Referral earnings cannot be negative"],
    },
    autopayBalance: {
      type: Number,
      default: 0,
      min: [0, "Autopay balance cannot be negative"], // Prevents invalid values
    },
    userType: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "delivery-partner", "manager"],
      default: "user",
    },
    assignedFranchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

// 🔥 High-speed compound indexes for frequent queries
// userSchema.index({
//   // mobileNumber: 1,  
//   email: 1,
// }); // Earliar using this index was causing issues with dual indexes
userSchema.index({ name: 1, gender: 1 });
userSchema.index({ referCode: 1, wallet: -1 });

// ✅ Create the optimized User model
const User = mongoose.model("User", userSchema);
export default User;
