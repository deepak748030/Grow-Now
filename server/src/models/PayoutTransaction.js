import mongoose from "mongoose";

const payoutTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },
  monthName: { type: String, required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner", required: true },
}, { timestamps: true });

export default mongoose.model("PayoutTransaction", payoutTransactionSchema);
