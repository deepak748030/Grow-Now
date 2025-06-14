import mongoose from "mongoose";

const FranchiseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cityName: { type: String, required: true },
    branchName: { type: String, required: true },
    location: {
      locationName: { type: String },
      lat: { type: Number },
      lang: { type: Number },
    },
    totalDeliveryRadius: { type: Number, required: true }, // in km
    freeDeliveryRadius: { type: Number, required: true }, // in km
    chargePerExtraKm: { type: Number, required: true }, // in ₹

    assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    polygonCoordinates: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Franchise", FranchiseSchema);
