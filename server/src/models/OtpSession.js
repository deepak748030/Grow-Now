import mongoose from "mongoose";

const otpSessionSchema = new mongoose.Schema({
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true,
  },
  sessionStartOtp: {
    type: String,
    required: true,
  },
  sessionEndOtp: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

export default mongoose.model("OtpSession", otpSessionSchema);
