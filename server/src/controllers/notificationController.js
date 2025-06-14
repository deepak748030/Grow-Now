import Notification from "../models/Notification.js";

// Create a new notification
export const createNotification = async (req, res) => {
    try {
        const { title, description, type, orderId } = req.body;

        if (!title || !type) {
            return res.status(400).json({ success: false, message: "Title and type are required." });
        }

        const newNotification = new Notification({ title, description, type, orderId });
        await newNotification.save();

        return res.status(201).json({ success: true, message: "Notification created successfully.", data: newNotification });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error creating notification.", error: error.message });
    }
};

// Get all notifications (with optional filters)
export const getAllNotifications = async (req, res) => {
    try {
        const filters = {};
        if (req.query.seen_status) filters.seen_status = req.query.seen_status === "true";
        if (req.query.type) filters.type = req.query.type;

        const notifications = await Notification.find(filters).sort({ createdAt: -1 });

        if (!notifications.length) {
            return res.status(404).json({ success: false, message: "No notifications found." });
        }

        return res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching notifications.", error: error.message });
    }
};

// Get a single notification by ID
export const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        return res.status(200).json({ success: true, data: notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching notification.", error: error.message });
    }
};

// Mark a notification as seen
export const markAsSeen = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        notification.seen_status = true;
        await notification.save();

        return res.status(200).json({ success: true, message: "Notification marked as seen.", data: notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error updating notification.", error: error.message });
    }
};

// Delete a single notification by ID
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        return res.status(200).json({ success: true, message: "Notification deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error deleting notification.", error: error.message });
    }
};

// Delete all notifications (use with caution)
export const deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({});
        return res.status(200).json({ success: true, message: "All notifications deleted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error deleting notifications.", error: error.message });
    }
};
