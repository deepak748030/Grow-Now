import cron from "node-cron";
import Attendance from "../models/Attendance.js";
import DeliveryPartner from "../models/DeliveryPartener.js"; 
import Worker from "../models/worker.js";

// Runs daily at 1:00 AM
cron.schedule("0 1 * * *", async () => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    const recordsToInsert = [];

    // Add delivery partners
    const deliveryPartners = await DeliveryPartner.find();
    for (const partner of deliveryPartners) {
      const alreadyExists = await Attendance.exists({
        DeliveryPartnerId: partner._id,
        date: startOfToday,
      });

      if (!alreadyExists) {
        recordsToInsert.push({
          DeliveryPartnerId: partner._id,
          type: "delivery-partner",
          date: startOfToday,
          status: "absent",
        });
      }
    }

    // Add workers
    const workers = await Worker.find();
    for (const worker of workers) {
      const alreadyExists = await Attendance.exists({
        workerId: worker._id,
        date: startOfToday,
      });

      if (!alreadyExists) {
        recordsToInsert.push({
          workerId: worker._id,
          type: worker.type, // could be 'worker' or 'truck-driver'
          date: startOfToday,
          status: "absent",
        });
      }
    }

    if (recordsToInsert.length > 0) {
      await Attendance.insertMany(recordsToInsert);
      console.log(`${recordsToInsert.length} attendance records created.`);
    } else {
      console.log("All attendance records already exist for today.");
    }
  } catch (error) {
    console.error("Error creating attendance records:", error.message);
  }
});
