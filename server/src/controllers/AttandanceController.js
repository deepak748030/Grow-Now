import DeliveryPartener from "../models/DeliveryPartener.js";
import worker from "../models/worker.js";
import Attendance from "../models/Attendance.js";

export const markAttendance = async (req, res) => {
  try {
    const { type, id, status, date } = req.body;

    if (!type || !id || !date || !status) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Determine the correct ID field based on type
    const idField =
      type === "delivery-partner"
        ? "DeliveryPartnerId"
        : type === "worker"
          ? "workerId"
          : type === "truck-driver"
            ? "truckDriverId"
            : null;

    if (!idField) {
      return res.status(400).json({ message: "Invalid type." });
    }

    // Update the status for that id on the given date
    const updatedAttendance = await Attendance.findOneAndUpdate(
      {
        [idField]: id,
        type,
        date: { $gte: targetDate, $lt: nextDay },
      },
      { status },
      { new: true }
    );

    if (!updatedAttendance) {
      return res
        .status(404)
        .json({ message: "No attendance record found for the given date." });
    }

    return res.status(200).json({
      message: "Attendance status updated successfully.",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("Error updating attendance:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const getAllAttendance = await Attendance.find({}).populate("workerId").populate("DeliveryPartnerId").sort({ date: -1 });
    if (!getAllAttendance) {
      return res.status(404).json({ message: "No attendance records found." });
    }
    return res.status(200).json({
      message: "Attendance records fetched successfully.",
      data: getAllAttendance,
    });

  } catch (error) {
    console.error("Error fetching attendance:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });

  }
}