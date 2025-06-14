import cron from "node-cron";
import OtpSession from "../models/OtpSession.js";
import DeliveryPartener from "../models/DeliveryPartener.js";

function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Runs daily at 12:30 AM
cron.schedule("30 0 * * *", async () => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    const partners = await DeliveryPartener.find();
    const sessions = [];

    for (const partner of partners) {
      const alreadyExists = await OtpSession.exists({
        deliveryPartnerId: partner._id,
        date: startOfToday,
      });

      if (!alreadyExists) {
        sessions.push({
          deliveryPartnerId: partner._id,
          branchId: partner.assignedBranchId,
          sessionStartOtp: generateOtp(),
          sessionEndOtp: generateOtp(),
          date: startOfToday,
        });
      }
    }

    if (sessions.length > 0) {
      await OtpSession.insertMany(sessions);
      console.log(`${sessions.length} new OTP sessions created for ${startOfToday.toDateString()}`);
    } else {
      console.log("No new OTP sessions needed — all up to date.");
    }
  } catch (err) {
    console.error("Cron job error:", err.message);
  }
});
