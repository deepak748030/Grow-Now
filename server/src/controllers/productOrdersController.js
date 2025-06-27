import ProductOrders from "../models/productOrders.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const createProductOrder = async (req, res) => {
  try {
    const {
      userId,
      productData,
      selectedType,
      quantity,
      totalPrice,
      orderDate,
      paymentMethod,
      address,
      locationLat,
      locationLng,
      locationType,
      flatNumber,
      buildingName,
      floor,
      landmark,
      gstAmount = 0,
      deliveryFees = 0,
      platformFees = 0,
      assignedFranchiseId,
    } = req.body;

    // Validate required fields
    if (
      !userId ||
      !productData ||
      !selectedType ||
      !quantity ||
      !totalPrice ||
      !orderDate ||
      !address ||
      !locationLat ||
      !locationLng ||
      !locationType ||
      !flatNumber ||
      !buildingName ||
      !floor ||
      !landmark ||
      !assignedFranchiseId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const foundUser = await User.findById(userId);
    if (!foundUser) return res.status(404).json({ error: "User not found" });

    let bonusUsed = 0;
    let depositUsed = 0;

    // Use ₹50 or available bonus, whichever is lower
    // if (foundUser.bonusWallet > 0) {
    //   bonusUsed = Math.min(foundUser.bonusWallet, 50); // Use the available bonus but cap at ₹50
    //   foundUser.bonusWallet -= bonusUsed; // Deduct the used bonus from user's bonus wallet
    // }

    // const remainingAmount = totalPrice - bonusUsed;

    // if (foundUser.wallet >= remainingAmount) {
    //   depositUsed = remainingAmount;
    //   // foundUser.wallet -= depositUsed;

    //   console.log(depositUsed);
    // } else {
    //   return res
    //     .status(400)
    //     .json({ error: "Insufficient deposit balance to complete the order" });
    // }

    const newOrder = await ProductOrders.create({
      userId,
      productData,
      selectedType,
      quantity,
      totalPrice,
      status: "Pending",
      orderDate,
      paymentMethod: paymentMethod || "Cash on Delivery",
      orderTimeStamps: Date.now(),
      bonusUsed,
      depositUsed,
      gstAmount,
      deliveryFees,
      platformFees,
      assignedFranchiseId,
      location: {
        address,
        locationLat,
        locationLng,
        locationType,
        flatNumber,
        buildingName,
        floor,
        landmark,
      },
    });

    await foundUser.save();

    const transaction = new Transaction({
      userId,
      amount: totalPrice,
      type: "debit",
      status: "success",
      title: "Product order payment",
      category: "product",
      description: "Order payment for product",
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Product order created successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Create product order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

export const getProductOrders = async (req, res) => {
  try {
    const { userId, status } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (status) query.status = status;

    const orders = await ProductOrders.find(query)
      .populate("userId", "name mobileNumber ")
      .populate("productData", "title weightOrCount imageUrl")
      .sort({ orderTimeStamps: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await ProductOrders.find({ userId: req.params.id }).populate(
      "userId productData"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await ProductOrders.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("userId productData");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryPartnerId, deliveryDate } = req.body;

    const order = await ProductOrders.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          deliveryPartnerId: deliveryPartnerId || "",
          deliveryDate: deliveryDate || "",
        },
      },
      { new: true }
    ).populate("userId productData");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await ProductOrders.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

export const getDeliveriesByPartnerAndDate = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;

    if (!deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: "Missing deliveryPartnerId",
      });
    }

    const orders = await ProductOrders.find({
      deliveryPartnerId,
      // status: "Pending",
    })
      .populate("userId")
      .populate("productData")
      .lean();

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No pending orders found for this delivery partner.",
      });
    }

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get deliveries error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deliveries",
      error: error.message,
    });
  }
};

export const updateOrderDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await ProductOrders.findByIdAndUpdate(
      req.params.id,
      { $set: { status: status } },
      { new: true }
    ).populate("userId productData");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Update delivery status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update delivery status",
      error: error.message,
    });
  }
};

export const updateProductOrderDeliveryStatus = async (req, res) => {
  try {
    const { productOrderId } = req.params;
    const { status, amountEarnedByDeliveryPartner } = req.body;

    if (!status || !amountEarnedByDeliveryPartner) {
      return res.status(400).json({ success: false, message: "Missing status or amountEarnedByDeliveryPartner" });
    }

    const updated = await ProductOrders.findByIdAndUpdate(
      productOrderId,
      {
        $set: {
          status,
          amountEarnedByDeliveryPartner,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product delivery status updated",
      data: {
        _id: updated._id,
        status: updated.status,
        amountEarnedByDeliveryPartner: updated.amountEarnedByDeliveryPartnerPartner,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating product delivery", error: err.message });
  }
};


// export const getOrdersByDate = async (req, res) => {
//   try {
//     const { franchiseId, date } = req.query;
//     const targetDate = new Date(date);

//     const productOrders = await ProductOrders.find({
//       assignedFranchiseId: franchiseId,
//       orderDate: targetDate,
//     });

//     res.json({ success: true, productOrders });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

export const changeProductDeliveryPartner = async (req, res) => {
  try {
    const { productOrderId, newPartnerId } = req.body;

    if (!productOrderId || !newPartnerId) {
      return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    const order = await ProductOrders.findById(productOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status && typeof order.status === 'string') {
      const allowed = ["Pending", "Delivered", "Failed", "Delayed"];
      const corrected = allowed.find(s => s.toLowerCase() === order.status.toLowerCase());

      if (corrected) {
        order.status = corrected;
      } else {
        order.status = "Pending";
      }
    }

    order.deliveryPartnerId = newPartnerId;
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
