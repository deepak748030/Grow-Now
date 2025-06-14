import express from "express";

import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

// 🔹 Get Dashboard Stats
router.get("/", getDashboardStats);

export default router;