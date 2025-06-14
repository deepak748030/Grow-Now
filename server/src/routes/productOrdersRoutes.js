import express from "express";
import {
    createProductOrder,
    getProductOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getDeliveriesByPartnerAndDate,
    updateOrderDeliveryStatus,
    updateProductOrderDeliveryStatus,
    // getOrdersByDate,
    changeProductDeliveryPartner,
} from "../controllers/productOrdersController.js";

const router = express.Router();

// 🔹 Create a new Subscription Order
router.post("/", createProductOrder);

// 🔹 Get all Subscription Orders (With Filters)
router.get("/", getProductOrders);

// 🔹 Get a Subscription Order by ID
router.get("/:id", getOrderById);


// 🔹 Update a Subscription Order by ID
router.patch("/:id", updateOrder);

// 🔹 Delete a Subscription Order by ID
router.delete("/:id", deleteOrder);

// 🔹 Get delivery by partnerid and date
router.post('/get-product-delivery', getDeliveriesByPartnerAndDate);

// 🔹 Update the delivery status of a specific order date
router.patch("/update-status/:id", updateOrderDeliveryStatus);

// 🔹 Update the delivery status of a specific order date
router.patch("/changeStatus/:productOrderId", updateProductOrderDeliveryStatus);

// router.get("/orders", getOrdersByDate);

router.patch("/product/change-delivery-partner", changeProductDeliveryPartner);


export default router;
