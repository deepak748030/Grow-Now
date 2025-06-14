import express from 'express';
const router = express.Router();
import { getHomeData } from '../controllers/homeController.js';

router.get("/", getHomeData)

export default router;
