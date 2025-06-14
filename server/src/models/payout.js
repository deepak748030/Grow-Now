import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    monthName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    }
  },
  { timestamps: true }
);

export default mongoose.model("Payout", payoutSchema);
