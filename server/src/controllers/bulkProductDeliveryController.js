import BulkDelivery from '../models/BulkProductDelivery.js';
import { SERVER_IMAGE_URL } from '../services/config.js';

export const createBulkDelivery = async (req, res) => {
    try {
        const { name, address, phoneNumber, deliveryDate } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, error: "Image is required" });
        }

        if (!name || !address || !phoneNumber || !deliveryDate) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

        const imageUrl = `${SERVER_IMAGE_URL}/uploads/${req.file.filename}`;

        const newEntry = new BulkDelivery({
            name,
            address,
            phoneNumber,
            deliveryDate,
            imageUrl,
        });

        await newEntry.save();

        res.status(201).json({ success: true, message: "Bulk delivery entry created", data: newEntry });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllBulkDeliveries = async (_req, res) => {
    try {
        const deliveries = await BulkDelivery.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: deliveries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateBulkDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["pending", "delivered", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
            });
        }

        const updated = await BulkDelivery.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, error: "Entry not found" });
        }

        res.status(200).json({
            success: true,
            message: `Status updated to ${status}`,
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteBulkDelivery = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await BulkDelivery.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "Bulk delivery entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Bulk delivery entry deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
