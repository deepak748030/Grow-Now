import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: String,
  number: String,
  idNumber: String,
  image: String,
  gender: String,
  age: Number,
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  type: { type: String, enum: ["worker", "truck-driver"], required: true },
  franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise", required: true },
}, { timestamps: true });

workerSchema.index(
  { franchiseId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "truck-driver" } }
);

export default mongoose.model("Worker", workerSchema);
