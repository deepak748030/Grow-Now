import express from "express";
import {
  addUnavailableLocation,
  getAllUnavailableLocations,
  getUnavailableLocationById,
  updateUnavailableLocation,
  deleteUnavailableLocation
} from "../controllers/unavailableLocation.js";

const router = express.Router();

router.post("/", addUnavailableLocation);
router.get("/", getAllUnavailableLocations);
router.get("/:id", getUnavailableLocationById);
router.put("/:id", updateUnavailableLocation);
router.delete("/:id", deleteUnavailableLocation);

export default router;
