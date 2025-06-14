import express from "express";
import {
    createOrder,
    getOrderById,
    getOrdersByUser,
    updateOrderStatus,
    deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();

// ✅ Create a new order
router.post("/", createOrder);

// ✅ Get a single order by ID
router.get("/:orderId", getOrderById);

// ✅ Get all orders for a specific user
router.get("/user/:userId", getOrdersByUser);

// ✅ Update order status (PATCH request)
router.patch("/:orderId", updateOrderStatus);

// ✅ Delete an order
router.delete("/:orderId", deleteOrder);

export default router;
