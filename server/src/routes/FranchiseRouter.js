import express from "express";
import {
  createFranchise,
  getFranchises,
  getFranchiseById,
  updateFranchise,
  deleteFranchise,
  getFranchiseByLocation,
  getFranchiseByOTP,
  getOrdersByDate,
  assignManagerForFranchise,
} from "../controllers/franchiseController.js";
const router = express.Router();

router.get('/orders', getOrdersByDate); // Get Order by DATE
router.post("/", createFranchise); // Create Franchise
router.get("/", getFranchises); // Get All Franchises
router.get("/:id", getFranchiseById); // Get Franchise by ID
router.put("/:id", updateFranchise); // Update Franchise
router.delete("/:id", deleteFranchise); // Delete Franchise
router.post('/getFranchiseByLocation', getFranchiseByLocation); // Get Franchise by Location

router.get('/getFranchiseOTP/:franchiseId', getFranchiseByOTP); // Get Franchise by OTP
router.post('/assignManagerForFranchise', assignManagerForFranchise); // Get Franchise by OTP

export default router;
