import { getAllAttendance, markAttendance } from "../controllers/AttandanceController.js";
import express from "express";

const router = express.Router();

// Route to mark attendance
router.put("/mark-attendance", markAttendance);
router.get("/get-attendance", getAllAttendance);

export default router;