import express from "express";
import upload from "../middleware/multer.js";
import {
    getSettings,
    updateSettings,
} from "../controllers/settingController.js";

const router = express.Router();

// GET current settings
router.get("/", getSettings);

// PATCH (Update) with multer image handling
router.patch("/", upload.fields([
    { name: "bottomImage", maxCount: 1 },
    { name: "referImage", maxCount: 1 },
    { name: "healthyBanner", maxCount: 1 },
    { name: "searchBackgroundImage", maxCount: 1 },
    { name: "topBannerImage", maxCount: 1 },
    { name: "referPageImageAttachment", maxCount: 1 },
]), updateSettings);

export default router;
