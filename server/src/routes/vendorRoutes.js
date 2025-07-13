import express from "express";
import {
    createVendor,
    getVendors,
    getVendor,
    updateVendor,
    deleteVendor,
    loginVendor
} from "../controllers/vendorController.js";

const router = express.Router();

router.post("/", createVendor);
router.get("/", getVendors);
router.get("/:id", getVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);
router.post("/login", loginVendor);

export default router;
