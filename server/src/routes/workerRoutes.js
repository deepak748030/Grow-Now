import express from "express";
import {
    createWorker,
    getWorkersByFranchise,
    updateWorkerStatus,
} from "../controllers/workerController.js";

const router = express.Router();

router.post("/", createWorker);
router.patch("/:id", updateWorkerStatus);
router.get("/:franchiseId", getWorkersByFranchise); 

export default router;