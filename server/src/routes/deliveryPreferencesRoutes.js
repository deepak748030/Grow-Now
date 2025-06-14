import express from "express";
import {
    createDeliveryPreference,
    getDeliveryPreference,
    updateDeliveryPreference,
    deleteDeliveryPreference
} from "../controllers/deliveryPreferencesController.js";

const router = express.Router();

// @route   POST /api/delivery-preferences
// @desc    Create delivery preferences
router.post("/", createDeliveryPreference);

// @route   GET /api/delivery-preferences/:userID
// @desc    Get delivery preferences for a user
router.get("/:userID", getDeliveryPreference);

// @route   PATCH /api/delivery-preferences/:userID
// @desc    Update delivery preferences for a user
router.patch("/:userID", updateDeliveryPreference);

// @route   DELETE /api/delivery-preferences/:userID
// @desc    Delete delivery preferences for a user
router.delete("/:userID", deleteDeliveryPreference);

export default router;
