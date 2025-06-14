import mongoose from "mongoose";

const unavailableLocationSchema = new mongoose.Schema({
  city: { type: String, required: true },
  area: { type: String, required: true },
  pinCode: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  reason: { type: String, default: "Service currently unavailable" },
});

export default mongoose.model("UnavailableLocation", unavailableLocationSchema);
