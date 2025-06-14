import express from "express";
import multer from "multer";
import {
  deleteDeliveryPartner,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  getDeliveryPartnerPayoutData,
  getDeliveryPartnersByFranchiseId,
  getDeliveryPartnerStats,
  loginDeliveryPartner,
  markOrderDelivered,
  registerDeliveryPartner,
  updateDeliveryPartner,
  updateDeliveryPartnerOnboardingStatus,
  updateDeliveryPartnerStatus,
  verifyDeliveryPartnerOtp,
} from "../controllers/DeliveryPartnerController.js";
import upload from "../middleware/multer.js"; // Import the multer configuration
const router = express.Router();

// 🟢 Create a Delivery Partner
router.post(
  "/register",
  upload.fields([
    { name: "aadharImage", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "profileImageUrl", maxCount: 1 },
  ]),
  registerDeliveryPartner
); // 🟢 Login the delivery partner
router.post("/login", loginDeliveryPartner);
router.get("/", getAllDeliveryPartners);
router.get("/:id", getDeliveryPartnerById);
router.patch("/:id", upload.fields([
  { name: "aadharImage", maxCount: 1 },
  { name: "panImage", maxCount: 1 },
  { name: "profileImageUrl", maxCount: 1 },
]), updateDeliveryPartner);
router.delete("/:id", deleteDeliveryPartner);
router.patch("/changeOnlineStatus/:id", updateDeliveryPartnerStatus);
router.patch("/changeStatus/:id", updateDeliveryPartnerOnboardingStatus);
router.post("/verify-otp", verifyDeliveryPartnerOtp);
router.get("/franchise/:franchiseId", getDeliveryPartnersByFranchiseId); // Get all delivery partners by franchise ID
router.post("/setDelivered", markOrderDelivered); // Set delivered status for a delivery partner
router.post("/getDeliveryPartnerStats/:deliveryPartnerId/status", getDeliveryPartnerStats);
router.get("/payout/:deliveryPartnerId", getDeliveryPartnerPayoutData);

export default router;
