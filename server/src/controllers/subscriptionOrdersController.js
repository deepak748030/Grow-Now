import mongoose from "mongoose";
import SubscriptionOrders from "../models/SubscriptionOrders.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Setting from "../models/Setting.js";
import moment from "moment";
// subscription
// Helper Function: Generate Delivery Dates Based on `days`
// const generateDeliveryDates = (startDate, selectedType, days) => {
//   const deliveryDates = [];
//   const totalDays = (days === "mon-sat" ? 26 : 22) * selectedType;
//   let actualRemainingDays = 0;

//   for (let i = 0; i < totalDays + 10; i++) {
//     const date = new Date(startDate);
//     date.setDate(date.getDate() + i);
//     const dayOfWeek = date.getDay();

//     const formattedDate = date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD

//     if (
//       (days === "mon-fri" && (dayOfWeek === 0 || dayOfWeek === 6)) ||
//       (days === "mon-sat" && dayOfWeek === 0)
//     ) {
//       deliveryDates.push({
//         date: formattedDate, // Save date in YYYY-MM-DD format
//         status: "non delivery day",
//         description: "",
//         deliveryPartnerId: null,
//         deliveryTime: "",
//         rating: null,
//         deliveryImage: "",
//       });
//       continue;
//     }

//     deliveryDates.push({
//       date: formattedDate, // Save date in YYYY-MM-DD format
//       status: "Scheduled",
//       description: "Scheduled for delivery",
//       deliveryPartnerId: null,
//       deliveryTime: "",
//       rating: 0,
//       deliveryImage: "",
//       isBoxCollected: false,
//       IsBoxCleaned: false,
//     });

//     actualRemainingDays++;
//     if (actualRemainingDays >= totalDays) break;
//   }

//   return { deliveryDates, actualRemainingDays };
// };

// Helper to find the added catch-up delivery date
function findAddedCatchupDate(dates, daysType, afterDate) {
  const holidayCheck = (date) => {
    const day = date.getDay();
    if (daysType === "mon-fri") return day === 0 || day === 6;
    if (daysType === "mon-sat") return day === 0;
    return false;
  };

  for (let d of dates) {
    const dateObj = new Date(d.date);
    if (!holidayCheck(dateObj) && dateObj > afterDate) {
      return d;
    }
  }

  return null;
}

function generateDeliveryDates(startDate, selectedType, days) {
  const totalDeliveryDays = (days === "mon-sat" ? 30 : 34) * selectedType;
  const totalDeliveryDaysDefault = 26 * selectedType;
  if (!totalDeliveryDays) return { deliveryDates: [], actualRemainingDays: 0 };

  const deliveryDates = [];
  const current = new Date(startDate);

  function formatDateIST(date) {
    const istOffset = 5.5 * 60 * 60 * 1000; // Our timezone
    const istDate = new Date(date.getTime() + istOffset);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  while (deliveryDates.length < totalDeliveryDays) {
    const day = current.getDay(); // 0 = Sunday, 6 = Saturday

    const isMonToSat = days === "mon-sat";
    const isMonToFri = days === "mon-fri";

    const isHoliday =
      (isMonToSat && day === 0) || // Skip Sunday
      (isMonToFri && (day === 0 || day === 6)); // Skip Saturday & Sunday

    const dateStr = formatDateIST(current);

    if (isHoliday) {
      deliveryDates.push({
        date: dateStr,
        status: "Holiday",
        description: "",
        deliveryPartnerId: null,
        deliveryTime: "",
        rating: 0,
        deliveryImage: "",
        isBoxCollected: false,
        IsBoxCleaned: false,
      });
    } else {
      deliveryDates.push({
        date: dateStr,
        status: "Pending",
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    deliveryDates,
    actualRemainingDays: totalDeliveryDaysDefault,
  };
}

// Create Subscription Order Controller (Session-Based)
export const createSubscriptionOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userID,
      location,
      finalAmount,
      totalAmount,
      orders,
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
      paymentType, // <-- added here
    } = req.body;

    if (
      !userID ||
      !location ||
      !finalAmount ||
      !totalAmount ||
      !orders ||
      !Array.isArray(orders) ||
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
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    const user = await User.findById(userID).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    // if (user.wallet < finalAmount) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Insufficient wallet balance!" });
    // }

    // user.wallet -= finalAmount;
    // await user.save({ session });

    // const transaction = new Transaction({
    //   userId: userID,
    //   amount: finalAmount,
    //   type: "debit",
    //   status: "success",
    //   title: "Subscription Order",
    //   category: "subscription",
    //   description: "Subscription order payment",
    // });
    // await transaction.save({ session });

    // Process each order to add delivery dates
    const processedOrders = orders.map((order) => {
      const { deliveryDates, actualRemainingDays } = generateDeliveryDates(
        order.startDate,
        order.selectedType,
        order.days
      );
      return { ...order, remainingDays: actualRemainingDays, deliveryDates };
    });

    // Create Subscription Order
    const newOrder = new SubscriptionOrders({
      userID,
      location,
      finalAmount,
      totalAmount,
      orders: processedOrders,
      gstAmount,
      deliveryFees,
      platformFees,
      assignedFranchiseId,
      paymentType, // <-- added here
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
    await newOrder.save({ session });

    // real time updates
    const io = req.app.get("io");
    const eventKey = `new-order-${assignedFranchiseId}`;
    io.to(assignedFranchiseId.toString()).emit(eventKey, {
      subscriptionId: newOrder._id,
      user: newOrder.userID,
      address: newOrder.location.address,
      products: newOrder.orders,
      status: "Active",
    });

    const referrelUser = user?.referredBy?.toString();

    // Check and reward referral bonus if it's the first subscription
    if (referrelUser) {
      const prevSubscriptions = await SubscriptionOrders.findOne({ userID });
      if (!prevSubscriptions) {
        const settings = await Setting.findOne();
        const referReward = settings?.referReward || 0;

        const referrer = await User.findById(referrelUser);

        if (referrer) {
          referrer.bonusWallet = (referrer.bonusWallet || 0) + referReward;
          await referrer.save({ session });
        }
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Order created successfully!",
      data: newOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get All Subscription Orders
export const getAllSubscriptionOrders = async (req, res) => {
  try {
    const orders = await SubscriptionOrders.find()
      .populate("userID", "name email mobileNumber") // Populate user details
      .populate("orders.subscriptionId", "title weightOrCount imageUrl"); // Populate subscription details
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get Subscription Order By ID
export const getSubscriptionOrderById = async (req, res) => {
  try {
    const order = await SubscriptionOrders.findById(req.params.id)
      .populate("userID", "name email mobileNumber") // Populate user details
      .populate("orders.subscriptionId", "title weightOrCount imageUrl"); // Populate subscription details;
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// Update Subscription Order
// export const updateSubscriptionOrder = async (req, res) => {
//     try {
//         const updatedOrder = await SubscriptionOrders.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!updatedOrder) return res.status(404).json({ success: false, message: "Order not found" });
//         res.status(200).json({ success: true, message: "Order updated successfully", data: updatedOrder });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Error updating order", error: error.message });
//     }
// };

// Update Delivery Status
export const updateSubscriptionOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId, delivery } = req.body;

    if (!orderId || !delivery?.deliveryId || !delivery?.status) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    // Validate status value against the model's expectations
    // const validStatuses = ["Pending", "Scheduled", "In Progress", "Delivered", "Cancelled", "non delivery day"];
    // if (!validStatuses.includes(delivery.status)) {
    //     return res.status(400).json({ success: false, message: "Invalid status value" });
    // }

    const updatedOrder = await SubscriptionOrders.findOneAndUpdate(
      {
        _id: id,
        "orders._id": orderId,
        "orders.deliveryDates._id": delivery.deliveryId,
      },
      {
        $set: {
          "orders.$[order].deliveryDates.$[date].status": delivery.status,
          "orders.$[order].deliveryDates.$[date].description":
            delivery.description || "",
          "orders.$[order].deliveryDates.$[date].deliveryTime":
            delivery.deliveryTime || "",
          "orders.$[order].deliveryDates.$[date].deliveryPartnerId":
            delivery.deliveryPartnerId || null,
          "orders.$[order].deliveryDates.$[date].deliveryImage":
            delivery.deliveryImage || "",
        },
      },
      {
        arrayFilters: [
          { "order._id": orderId },
          { "date._id": delivery.deliveryId },
        ],
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order or delivery date not found" });
    }

    res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Subscription Order
export const deleteSubscriptionOrder = async (req, res) => {
  try {
    const deletedOrder = await SubscriptionOrders.findByIdAndDelete(
      req.params.id
    );
    if (!deletedOrder)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error.message,
    });
  }
};

// Get Orders By User
export const getOrdersByUser = async (req, res) => {
  try {
    const orders = await SubscriptionOrders.find({ userID: req.params.userID })
      .populate("userID", "name email mobileNumber") // Populate user details
      .populate("orders.subscriptionId", "title weightOrCount imageUrl"); // Populate subscription details;
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user orders",
      error: error.message,
    });
  }
};

// Get Orders By Subscription
export const getOrdersBySubscription = async (req, res) => {
  try {
    const orders = await SubscriptionOrders.find({
      subscriptionID: req.params.subscriptionID,
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subscription orders",
      error: error.message,
    });
  }
};

// Update Delivery Status
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await SubscriptionOrders.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedOrder)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating delivery status",
      error: error.message,
    });
  }
};

// Pause Subscription
// controllers/subscriptionController.js
export const pauseSubscription = async (req, res) => {
  try {
    const { userId, deliveryDateId } = req.body;

    if (!userId || !deliveryDateId) {
      return res
        .status(400)
        .json({ message: "User ID and delivery date ID are required" });
    }

    const subscription = await SubscriptionOrders.findOne({
      userID: userId,
      "orders.deliveryDates._id": deliveryDateId,
    });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Subscription or delivery date not found" });
    }

    // Check the time of the order along with settings maxSubscriptionUpdateOrCancelTime
    const settings = await Setting.findOne();
    const cutoffTimeStr = settings?.maxSubscriptionUpdateOrCancelTime;

    // Create today's cutoff time
    const now = new Date();
    const [time, modifier] = cutoffTimeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

    const cutoffTime = new Date(now);
    cutoffTime.setHours(hours, minutes, 0, 0);

    // Check if current time is before cutoff
    if (now > cutoffTime) {
      return res.status(400).json({
        message: `You can only pause subscription before ${cutoffTimeStr}`,
      });
    }

    let updated = false;
    let pausedOrder = null;

    // Find the deliveryDate by ID and pause it
    for (let order of subscription.orders) {
      const delivery = order.deliveryDates.find(
        (d) => d._id.toString() === deliveryDateId
      );
      if (delivery) {
        if (delivery.status === "Paused") {
          return res.status(400).json({ message: "Already paused" });
        }

        delivery.status = "Paused";
        delivery.description = "Delivery paused";
        pausedOrder = order;
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({ message: "Delivery date not found" });
    }

    // Add a new delivery date for the paused order
    if (pausedOrder) {
      const deliveryPattern = pausedOrder.deliveryPattern || "mon-fri"; // fallback to mon-fri
      const holidays = deliveryPattern === "mon-fri" ? [0, 6] : [0]; // Sunday = 0, Saturday = 6

      // Find the last delivery date
      const sortedDates = pausedOrder.deliveryDates
        .map((d) => new Date(d.date))
        .sort((a, b) => a - b);

      let lastDate = sortedDates[sortedDates.length - 1];

      // Calculate next valid delivery date
      let nextDate = new Date(
        Date.UTC(
          lastDate.getUTCFullYear(),
          lastDate.getUTCMonth(),
          lastDate.getUTCDate()
        )
      );

      // Find the next valid delivery day, skipping holidays
      do {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      } while (holidays.includes(nextDate.getUTCDay()));

      // Format the date as yyyy-mm-dd
      const formattedNextDate = nextDate.toISOString().split("T")[0];

      pausedOrder.deliveryDates.push({
        date: formattedNextDate,
        status: "Scheduled",
        deliveryPartnerId: pausedOrder.deliveryPartnerId || null,
        amountEarnedByDelivery: 0,
        isDelivered: false,
        isBoxPicked: false,
        isBoxCleaned: false,
        deliveryTime: null,
        deliveryImage: null,
        description: "Added due to pause",
      });
    }

    await subscription.save();

    res.json({
      message: "Delivery paused successfully and new date added",
      deliveryDateId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to pause delivery" });
  }
};
export const resumeSubscription = async (req, res) => {
  try {
    const { userId, deliveryDateId } = req.body;

    if (!userId || !deliveryDateId) {
      return res
        .status(400)
        .json({ message: "User ID and delivery date ID are required" });
    }

    const subscription = await SubscriptionOrders.findOne({
      userID: userId,
      "orders.deliveryDates._id": deliveryDateId,
    });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Subscription or delivery date not found" });
    }

    let orderFound = null;
    let pausedDate = null;

    for (const order of subscription.orders) {
      const delivery = order.deliveryDates.find(
        (d) => d._id.toString() === deliveryDateId
      );
      if (delivery) {
        orderFound = order;
        pausedDate = delivery;
        break;
      }
    }

    if (!orderFound || !pausedDate) {
      return res.status(404).json({ message: "Delivery date not found" });
    }

    if (pausedDate.status !== "Paused") {
      return res.status(400).json({ message: "Delivery is not paused" });
    }

    // Update the paused delivery date to "Scheduled"
    pausedDate.status = "Scheduled";
    pausedDate.description = "Resumed delivery";

    // Find the most recently created delivery date (date-wise)
    const sortedDates = orderFound.deliveryDates
      .map((d) => new Date(d.date))
      .sort((a, b) => b - a);

    const mostRecentDate = sortedDates[0];

    // Remove the most recently created delivery date if it was added due to a pause
    const lastCreatedDate = orderFound.deliveryDates.find(
      (d) => new Date(d.date).getTime() === mostRecentDate.getTime()
    );

    if (
      lastCreatedDate &&
      lastCreatedDate.description === "Added due to pause"
    ) {
      orderFound.deliveryDates = orderFound.deliveryDates.filter(
        (d) => d._id.toString() !== lastCreatedDate._id.toString()
      );
    }

    await subscription.save();

    res.json({
      message: "Subscription resumed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
};

export const getDeliveriesByPartnerAndDate = async (req, res) => {
  try {
    const { partnerID, date } = req.body;

    if (!partnerID || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Missing partnerID or date" });
    }

    const subscriptionOrders = await SubscriptionOrders.find({
      "orders.deliveryDates.deliveryPartnerId": partnerID,
      "orders.deliveryDates.date": date,
    })
      .populate("userID", "name email mobileNumber")
      .populate("orders.subscriptionId");

    const deliveries = [];

    subscriptionOrders.forEach((order) => {
      order.orders.forEach((subOrder) => {
        subOrder.deliveryDates.forEach((deliveryDate) => {
          if (
            deliveryDate.deliveryPartnerId?.toString() === partnerID &&
            deliveryDate.date === date
          ) {
            deliveries.push({
              orderId: order._id,
              userId: order.userID._id,
              userName: order.userID.name,
              userEmail: order.userID.email,
              userMobile: order.userID.mobileNumber,
              subscriptionId: subOrder.subscriptionId,
              deliveryDateId: deliveryDate._id,
              status: deliveryDate.status,
              deliveryTime: deliveryDate.deliveryTime,
              productDetail: subOrder.productDetail,
              deliveryAddress: order.location.address,
              isBoxPicked: deliveryDate.isBoxPicked,
              isBoxCleaned: deliveryDate.IsBoxCleaned,
              deliveryImage: deliveryDate.deliveryImage,
              amountEarnedByDelivery:
                deliveryDate.amountEarnedByDeliveryPartner,
              location: order.location,
              deliveryDate: deliveryDate.date,
            });
          }
        });
      });
    });

    return res.status(200).json({
      success: true,
      deliveries,
    });
  } catch (error) {
    console.error("Error in getDeliveriesByPartnerAndDate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { deliveryDateId } = req.params;
    const { status } = req.body;
    // const { subscriptionId, deliveryDateId, status } = req.body;

    console.log("Request Body:", req.body, deliveryDateId);

    // Validate required fields
    if (!deliveryDateId || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing deliveryDateId, or status",
      });
    }

    // Update the status of the specified deliveryDateId
    const updatedSubscription = await SubscriptionOrders.findOneAndUpdate(
      {
        "orders.deliveryDates._id": new mongoose.Types.ObjectId(deliveryDateId),
      },
      {
        $set: {
          "orders.$.deliveryDates.$[elem].status": status, // Updates the status of the matching delivery date
        },
      },
      {
        arrayFilters: [
          { "elem._id": new mongoose.Types.ObjectId(deliveryDateId) },
        ],
        new: true, // Return the updated document
      }
    );

    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        message: "Delivery date not found",
      });
    }

    const updatedDeliveryDate = updatedSubscription.orders
      .flatMap((order) => order.deliveryDates)
      .find((deliveryDate) => deliveryDate._id.toString() === deliveryDateId);

    res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      data: updatedDeliveryDate, // Only return the updated delivery date object
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateSubscriptionDeliveryStatus = async (req, res) => {
  try {
    const { deliveryDateId } = req.params;
    const { status, amountEarnedByDeliveryPartner } = req.body;

    if (!status || !amountEarnedByDeliveryPartner) {
      return res.status(400).json({
        success: false,
        message: "Missing status or amountEarnedByDeliveryPartner",
      });
    }

    const updated = await SubscriptionOrders.findOneAndUpdate(
      { "orders.deliveryDates._id": deliveryDateId },
      {
        $set: {
          "orders.$[].deliveryDates.$[elem].status": status,
          "orders.$[].deliveryDates.$[elem].amountEarnedByDeliveryPartner":
            amountEarnedByDeliveryPartner,
        },
      },
      {
        arrayFilters: [{ "elem._id": deliveryDateId }],
        new: true,
      }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "DeliveryDate not found" });
    }

    const updatedDeliveryDate = updated.orders
      .flatMap((order) => order.deliveryDates)
      .find((date) => date._id.toString() === deliveryDateId);

    res.status(200).json({
      success: true,
      message: "Subscription delivery status updated",
      data: updatedDeliveryDate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating subscription",
      error: err.message,
    });
  }
};

export const getUnassignedSubscriptionOrders = async (req, res) => {
  try {
    const { franchiseId } = req.query;

    if (!franchiseId) {
      return res
        .status(400)
        .json({ success: false, message: "franchiseId is required" });
    }
    console.log(franchiseId);
    const orders = await SubscriptionOrders.find({
      assignedFranchiseId: franchiseId,
      "orders.deliveryDates.deliveryPartnerId": null,
      subscriptionStatus: "Active",
    })
      .populate("userID")
      .populate("orders.subscriptionId");

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching unassigned subscription orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// export const getOrdersByDate = async (req, res) => {
//   try {
//     const { franchiseId, date } = req.query;
//     const targetDate = new Date(date);

//     const subscriptionOrders = await SubscriptionOrders.find({
//       assignedFranchiseId: franchiseId,
//       "orders.deliveryDates.date": targetDate,
//     });

//     const productOrders = await Produts.find({
//       assignedFranchiseId: franchiseId,
//       orderDate: targetDate,
//     });

//     res.json({ success: true, subscriptionOrders });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

export const updateDeliveryPartnerForSubscription = async (req, res) => {
  try {
    const { orderId, date, newDeliveryPartnerId } = req.body;

    if (!orderId || !date || !newDeliveryPartnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    const order = await SubscriptionOrders.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    for (const o of order.orders) {
      const targetDate = o.deliveryDates.find((d) => {
        const dString = new Date(d.date).toISOString().slice(0, 10);
        return dString === date;
      });
      if (targetDate) {
        targetDate.deliveryPartnerId = newDeliveryPartnerId;
      }
    }

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const assignDeliveryPartner = async (req, res) => {
  const { orderIds } = req.body;
  const { deliveryPartnerId } = req.params;

  // Check if the orderIds and deliveryPartnerId are valid
  if (!orderIds || !Array.isArray(orderIds) || !deliveryPartnerId) {
    return res.status(400).json({ message: "Missing required fields!" });
  }

  if (!Array.isArray(orderIds) || !deliveryPartnerId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields!" });
  }

  try {
    const updatedOrders = await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await SubscriptionOrders.findOne({
          orders: {
            $elemMatch: { _id: new mongoose.Types.ObjectId(orderId) },
          },
        });
        if (!order) return null;

        // Loop through each order -> each deliveryDate and update deliveryPartnerId
        order.orders.forEach((orderItem) => {
          orderItem.deliveryDates.forEach((dateItem) => {
            dateItem.deliveryPartnerId = new mongoose.Types.ObjectId(
              deliveryPartnerId
            );
          });
        });

        await order.save();
        return orderId;
      })
    );

    const filtered = updatedOrders.filter(Boolean); // remove nulls

    if (filtered.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid orders found to update." });
    }

    res.status(200).json({
      success: true,
      message: "Delivery partner assigned to specified orders successfully.",
      updatedOrderIds: filtered,
    });
  } catch (error) {
    console.error("Error updating delivery partner:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const pauseAllSubscription = async (req, res) => {
  try {
    const { date, franchiseIds } = req.body;

    if (!date || !franchiseIds || !Array.isArray(franchiseIds)) {
      return res.status(400).json({
        message: "Both 'date' (yyyy-mm-dd) and 'franchiseIds' (array) are required",
      });
    }

    const settings = await Setting.findOne();
    const cutoffTimeStr = settings?.maxSubscriptionUpdateOrCancelTime;

    const now = new Date();
    const [time, modifier] = cutoffTimeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

    const cutoffTime = new Date(now);
    cutoffTime.setHours(hours, minutes, 0, 0);

    if (now > cutoffTime) {
      return res.status(400).json({
        message: `You can only pause subscription before ${cutoffTimeStr}`,
      });
    }

    console.log(franchiseIds, date);

    const query = {
      "orders.deliveryDates.date": date,
    };

    if (!franchiseIds.includes("all")) {
      query.assignedFranchiseId = { $in: franchiseIds };
    }

    const subscriptions = await SubscriptionOrders.find(query);

    console.log("Subscriptions found:", subscriptions.length);

    if (!subscriptions.length) {
      return res.status(404).json({
        message: "No matching subscriptions found for the given date and franchiseIds",
      });
    }

    let updatedCount = 0;

    for (const subscription of subscriptions) {
      for (let order of subscription.orders) {
        const delivery = order.deliveryDates.find((d) => d.date === date);

        if (!delivery || delivery.status === "Paused") continue;

        // Pause the delivery
        delivery.status = "Paused";
        delivery.description = "Delivery paused";
        updatedCount++;

        // Handle adding an extra date at the end
        const deliveryPattern = order.deliveryPattern || "mon-fri";
        const holidays = deliveryPattern === "mon-fri" ? [0, 6] : [0];

        const sortedDates = order.deliveryDates
          .map((d) => new Date(d.date))
          .sort((a, b) => a - b);

        let lastDate = sortedDates[sortedDates.length - 1];
        let nextDate = new Date(
          Date.UTC(
            lastDate.getUTCFullYear(),
            lastDate.getUTCMonth(),
            lastDate.getUTCDate()
          )
        );

        do {
          nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        } while (holidays.includes(nextDate.getUTCDay()));

        const formattedNextDate = nextDate.toISOString().split("T")[0];

        order.deliveryDates.push({
          date: formattedNextDate,
          status: "Scheduled",
          deliveryPartnerId: order.deliveryPartnerId || null,
          amountEarnedByDelivery: 0,
          isDelivered: false,
          isBoxPicked: false,
          isBoxCleaned: false,
          deliveryTime: null,
          deliveryImage: null,
          description: "Added due to pause",
        });

        break; // Only one delivery per subscription per day
      }

      await subscription.save();
    }

    res.json({
      message: `Paused deliveries for ${updatedCount} subscriptions on ${date}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to pause deliveries" });
  }
};
// orderId: subOrder._id
export const assignDeliveryPartnerToUnassigned = async (req, res) => {
  const { orderIds } = req.body;
  const { deliveryPartnerId } = req.params;

  // Validate input
  if (!orderIds || !Array.isArray(orderIds) || !deliveryPartnerId) {
    return res.status(400).json({ success: false, message: "Missing or invalid required fields!" });
  }

  try {
    const updatedOrders = await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await SubscriptionOrders.findOne({
          "orders._id": new mongoose.Types.ObjectId(orderId),
        });

        if (!order) return null;

        // Update only deliveryDates with empty deliveryPartnerId
        let isUpdated = false;
        order.orders.forEach((orderItem) => {
          if (orderItem._id.toString() === orderId) {
            orderItem.deliveryDates.forEach((dateItem) => {
              if (!dateItem.deliveryPartnerId) {
                dateItem.deliveryPartnerId = new mongoose.Types.ObjectId(deliveryPartnerId);
                isUpdated = true;
              }
            });
          }
        });

        if (isUpdated) {
          await order.save();
          return orderId;
        }
        return null;
      })
    );

    const filteredOrderIds = updatedOrders.filter(Boolean); // Remove nulls

    if (filteredOrderIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid unassigned orders found to update.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Delivery partner assigned to unassigned orders successfully.",
      updatedOrderIds: filteredOrderIds,
    });
  } catch (error) {
    console.error("Error assigning delivery partner:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updatePaymentType = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Missing orderId" });
    }

    const order = await SubscriptionOrders.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentType !== "COD") {
      return res.status(400).json({ success: false, message: "Payment type is not COD" });
    }

    order.paymentType = "ONLINE";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment type updated to ONLINE",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating payment type",
      error: error.message,
    });
  }
};