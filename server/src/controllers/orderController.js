import Order from "../models/Order.js";

// ✅ Create a new order
export const createOrder = async (req, res) => {
    try {
        const { user, products, totalAmount, paymentMethod } = req.body;

        if (!user || !products?.length || !totalAmount || !paymentMethod) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const order = new Order({ user, products, totalAmount, paymentMethod });
        await order.save();

        res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
        console.error("❌ Error creating order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate("user products.product").lean();

        if (!order) return res.status(404).json({ error: "Order not found" });

        res.status(200).json(order);
    } catch (error) {
        console.error("❌ Error fetching order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Get all orders for a specific user
export const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user: userId }).populate("products.product").lean();

        if (!orders.length) return res.status(404).json({ error: "No orders found for this user" });

        res.status(200).json(orders);
    } catch (error) {
        console.error("❌ Error fetching user orders:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Get all orders with optional filters
export const getAllOrders = async (req, res) => {
    try {
        const { status, paymentStatus, limit = 10, page = 1 } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (paymentStatus) filters.paymentStatus = paymentStatus;

        const orders = await Order.find(filters)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * limit)
            .sort({ createdAt: -1 })
            .populate("products.product")
            .lean();

        res.status(200).json(orders);
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Update order status or payment status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;

        const updateFields = {};
        if (status) updateFields.status = status;
        if (paymentStatus) updateFields.paymentStatus = paymentStatus;

        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, { new: true, lean: true });

        if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

        res.status(200).json({ message: "Order updated successfully", updatedOrder });
    } catch (error) {
        console.error("❌ Error updating order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Delete an order
export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(orderId).lean();

        if (!deletedOrder) return res.status(404).json({ error: "Order not found" });

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
