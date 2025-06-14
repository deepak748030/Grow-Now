import express from "express";
import {
    createSubscriptionOrder,
    getAllSubscriptionOrders,
    getSubscriptionOrderById,
    updateSubscriptionOrder,
    deleteSubscriptionOrder,
    getOrdersByUser,
    getOrdersBySubscription,
    updateDeliveryStatus,
    pauseSubscription,
    getDeliveriesByPartnerAndDate,
    updateSubscriptionStatus,
    updateSubscriptionDeliveryStatus,
    getUnassignedSubscriptionOrders,
    // getOrdersByDate,
    updateDeliveryPartnerForSubscription,
    resumeSubscription,
    assignDeliveryPartner,
    pauseAllSubscription,
    assignDeliveryPartnerToUnassigned,
    updatePaymentType,
} from "../controllers/subscriptionOrdersController.js";

const router = express.Router();

// 🔹 Create a new Subscription Order
router.post("/", createSubscriptionOrder);

// 🔹 Get all Subscription Orders (With Filters)
router.get("/", getAllSubscriptionOrders);

// 🔹 Get a Subscription Order by ID
// router.get("/:id", getSubscriptionOrderById);

// 🔹 Get all orders of a specific user
router.get("/user/:userID", getOrdersByUser);

// 🔹 Get all orders under a specific subscription
router.get("/subscription/:subscriptionID", getOrdersBySubscription);

// 🔹 Update a Subscription Order by ID
router.patch("/:id", updateSubscriptionOrder);

// 🔹 Update the delivery status of a specific order date
router.patch("/:id/delivery-status", updateDeliveryStatus);

// 🔹 Delete a Subscription Order by ID
router.delete("/:id", deleteSubscriptionOrder);

// 🔹 Pause a Subscription Order
router.post('/pause', pauseSubscription);

// 🔹 Resume
router.post('/resume', resumeSubscription);

// 🔹 Get delivery by partner and date
router.post('/get-delivery', getDeliveriesByPartnerAndDate);

// 🔹 Update subscription status
router.patch('/update-status/:deliveryDateId', updateSubscriptionStatus);

// 🔹 Update subscription delivery status
router.patch("/changeStatus/:deliveryDateId", updateSubscriptionDeliveryStatus);

// 🔹 Get all unassigned subscription orders
router.get("/unassigned", getUnassignedSubscriptionOrders);
router.get("/:id", getSubscriptionOrderById);

// 🔹Get order by date and fanchiseId
// router.get("/orders", getOrdersByDate);
router.put("/change-delivery-partner", updateDeliveryPartnerForSubscription);

router.patch("/assign-delivery-partner/:deliveryPartnerId", assignDeliveryPartner);

// 🔹 Pause all
router.post('/pause-all', pauseAllSubscription);
// 🔹 Assign delivery partner to unassigned subscription orders
router.patch("/assign-delivery-partner-to-unassigned/:deliveryPartnerId", assignDeliveryPartnerToUnassigned);

router.patch("/update-payment-type/:orderId", updatePaymentType)

export default router;
