import express from "express";
import { getPayoutByDeliveryPartnerId, requestPayout } from "../controllers/requestPayoutController.js"; // Import the controller function
const router = express.Router();

// 🟢 Create a Delivery Partner
router.post("/", requestPayout);
router.get("/:deliveryPartnerId", getPayoutByDeliveryPartnerId);

export default router;