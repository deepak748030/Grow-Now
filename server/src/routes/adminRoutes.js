import express from "express";
import { login, register } from "../controllers/adminController.js";
import { createManager, deleteManager, getAllManagers } from "../controllers/userController.js";

const router = express.Router();

// Admin routes
router.post('/login', login);
router.post('/register', register);
router.post('/create-manager', createManager);
router.get('/get-managers', getAllManagers);
router.delete('/delete-manager/:id', deleteManager); // Assuming you have a delete manager function


export default router;
