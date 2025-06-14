
import express from "express";
import { deleteBoxReview, getAllBoxReviews } from "../controllers/boxController.js";

const router = express.Router();


router.get("/", getAllBoxReviews); // Get all box reviews

router.delete("/:id", deleteBoxReview);

export default router;