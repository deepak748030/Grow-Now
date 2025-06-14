import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  description: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  image: { type: String }, // base64 or URL
  date: { type: Date, default: Date.now },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner", required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise" },
});

export default mongoose.model("Review", reviewSchema);
