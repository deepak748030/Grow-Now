import express from "express";
const router = express.Router();
import {
    createNotification,
    getAllNotifications,
    getNotificationById,
    markAsSeen,
    deleteNotification,
    deleteAllNotifications
} from "../controllers/notificationController.js";

// Create a new notification
router.post("/", createNotification);

// Get all notifications (with optional filters)
router.get("/", getAllNotifications);

// Get a single notification by ID
router.get("/:id", getNotificationById);

// Mark a notification as seen
router.patch("/:id/seen", markAsSeen);

// Delete a single notification by ID
router.delete("/:id", deleteNotification);

// Delete all notifications (use with caution)
router.delete("/", deleteAllNotifications);

export default router;
