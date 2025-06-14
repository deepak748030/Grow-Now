import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
      DeliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: 'DeliveryPartner',
      },
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: 'Worker',
      },
      type: {
        type: String,
        enum: ['delivery-partner', 'worker', 'truck-driver'],
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'present', 'absent', 'holiday'],
        default: 'absent',
      },
    },
    { timestamps: true }
  );

export default mongoose.model("Attendance", attendanceSchema);