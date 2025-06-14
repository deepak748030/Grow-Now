import DeliveryPreferences from "../models/DeliveryPreferences.js";

// @desc    Create a new delivery preference
export const createDeliveryPreference = async (req, res) => {
    try {
        const { userID, callBeforeDelivery, ringTheBell, doorImage, address } = req.body;

        // Check if all required fields exist
        if (!userID || !address) {
            return res.status(400).json({ success: false, message: "User ID and Address are required." });
        }

        // Create and save the new delivery preference
        const newPreference = await DeliveryPreferences.create({
            userID,
            callBeforeDelivery: callBeforeDelivery || false,
            ringTheBell: ringTheBell || false,
            doorImage: doorImage || "",
            address
        });

        res.status(201).json({ success: true, message: "Delivery preference created successfully.", data: newPreference });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

// @desc    Get a user's delivery preferences
export const getDeliveryPreference = async (req, res) => {
    try {
        const { userID } = req.params;

        // Validate userID
        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required." });
        }

        const preference = await DeliveryPreferences.findOne({ userID });

        if (!preference) {
            return res.status(404).json({ success: false, message: "No delivery preferences found for this user." });
        }

        res.status(200).json({ success: true, data: preference });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

// @desc    Update a user's delivery preferences
export const updateDeliveryPreference = async (req, res) => {
    try {
        const { userID } = req.params;
        const updateData = req.body;

        // Validate userID
        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required." });
        }

        const updatedPreference = await DeliveryPreferences.findOneAndUpdate(
            { userID },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPreference) {
            return res.status(404).json({ success: false, message: "No delivery preferences found for this user." });
        }

        res.status(200).json({ success: true, message: "Delivery preferences updated successfully.", data: updatedPreference });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

// @desc    Delete a user's delivery preferences
export const deleteDeliveryPreference = async (req, res) => {
    try {
        const { userID } = req.params;

        // Validate userID
        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required." });
        }

        const deletedPreference = await DeliveryPreferences.findOneAndDelete({ userID });

        if (!deletedPreference) {
            return res.status(404).json({ success: false, message: "No delivery preferences found for this user." });
        }

        res.status(200).json({ success: true, message: "Delivery preferences deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
