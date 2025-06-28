import DeliveryPartener from "../models/DeliveryPartener.js";
import OtpSession from "../models/OtpSession.js";
import Payout from "../models/payout.js";
import productOrders from "../models/productOrders.js";
import User from '../models/User.js'
import SubscriptionOrders from "../models/SubscriptionOrders.js";
import moment from "moment";
// import redis from "../redis/redisClient.js";
import Attendance from "../models/Attendance.js";
import BoxReview from "../models/BoxReviews.js";
import { SERVER_IMAGE_URL } from "../services/config.js";
export const registerDeliveryPartner = async (req, res) => {
  try {
    const {
      assignedBranchId,
      firstName,
      lastName,
      gender,
      tshirtSize,
      state,
      aadharDetails,
      panDetails,
      mobileNumber,
      vehicleType,
      city,
      branch,
      withdrawalDetails,
    } = req.body;

    const aadharImage =
      req?.files?.aadharImage?.[0]?.path
        .replace(/\\/g, "/")
        .replace(/^/, SERVER_IMAGE_URL) ?? "";
    const panImage =
      req?.files?.panImage?.[0]?.path
        .replace(/\\/g, "/")
        .replace(/^/, SERVER_IMAGE_URL) ?? "";
    const profileImageUrl =
      req?.files?.profileImageUrl?.[0]?.path
        .replace(/\\/g, "/")
        .replace(/^/, SERVER_IMAGE_URL) ?? "";

    const requiredFields = [
      firstName,
      lastName,
      gender,
      tshirtSize,
      state,
      aadharDetails?.aadharNumber,
      aadharDetails?.aadharName,
      panDetails?.panNumber,
      panDetails?.panName,
      mobileNumber,
      vehicleType,
      city,
      branch,
      withdrawalDetails?.selectedPrimaryMethod,
    ];

    if (requiredFields.includes(undefined) || requiredFields.includes("")) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (withdrawalDetails.selectedPrimaryMethod === "bank") {
      if (!withdrawalDetails.accountNumber || !withdrawalDetails.ifscCode) {
        return res.status(400).json({
          success: false,
          message: "Account number and IFSC code are required for bank method.",
        });
      }
    } else if (withdrawalDetails.selectedPrimaryMethod === "upi") {
      if (!withdrawalDetails.upiId) {
        return res.status(400).json({
          success: false,
          message: "UPI ID is required for UPI method.",
        });
      }
    }

    const orConditions = [];

    if (aadharDetails?.aadharNumber) {
      orConditions.push({
        "aadharDetails.aadharNumber": aadharDetails.aadharNumber,
      });
    }
    if (panDetails?.panNumber) {
      orConditions.push({ "panDetails.panNumber": panDetails.panNumber });
    }
    if (mobileNumber) {
      orConditions.push({ mobileNumber });
    }

    const existingPartner = orConditions.length
      ? await DeliveryPartener.findOne({ $or: orConditions })
      : null;

    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery Partner with the same Aadhar, PAN, or Mobile Number already exists.",
      });
    }

    const newPartner = new DeliveryPartener({
      assignedBranchId,
      firstName,
      lastName,
      gender,
      tshirtSize,
      state,
      profileImageUrl,
      aadharDetails: {
        aadharNumber: aadharDetails.aadharNumber,
        aadharName: aadharDetails.aadharName,
        aadharImage,
      },
      panDetails: {
        panNumber: panDetails.panNumber,
        panName: panDetails.panName,
        panImage,
      },
      mobileNumber,
      vehicleType,
      city,
      branch,
      withdrawalDetails,
    });

    await newPartner.save();

    return res.status(201).json({
      success: true,
      message: "Delivery Partner registered successfully.",
      data: newPartner,
    });
  } catch (error) {
    console.error("Error registering Delivery Partner:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const loginDeliveryPartner = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is required" });
    }

    const deliveryPartner = await DeliveryPartener.findOne({ mobileNumber });

    if (!deliveryPartner) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery Partner not found" });
    }
    // await redis.del("deliveryPartnersCache"); // Clear cache for delivery partners

    // You can later add OTP verification, JWT, etc.
    return res.status(200).json({
      success: true,
      data: {
        _id: deliveryPartner._id,
        name: deliveryPartner.name,
        mobileNumber: deliveryPartner.mobileNumber,
        city: deliveryPartner.city,
        branch: deliveryPartner.branch,
        rank: deliveryPartner.rank,
        wallet: deliveryPartner.wallet,
        rating: deliveryPartner.rating,
        withdrawalDetails: deliveryPartner.withdrawalDetails,
        onboardingStatus: deliveryPartner.onboardingStatus,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllDeliveryPartners = async (req, res) => {
  try {
    // const cacheDeliveryPartner = await redis.get("deliveryPartnersCache");
    // if (cacheDeliveryPartner) {
    //   return res
    //     .status(200)
    //     .json({ success: true, data: JSON.parse(cacheDeliveryPartner) });
    // }
    const partners = await DeliveryPartener.find();
    // await redis.set(
    //   "deliveryPartnersCache",
    //   JSON.stringify(partners),
    //   "EX",
    //   3600
    // ); // Cache for 1 hour
    res.status(200).json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery partners.",
      error: error.message,
    });
  }
};

export const getDeliveryPartnerById = async (req, res) => {
  try {
    const partner = await DeliveryPartener.findById(req.params.id);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery Partner not found." });
    }
    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery partner.",
      error: error.message,
    });
  }
};

export const updateDeliveryPartner = async (req, res) => {
  try {
    const updateData = {};

    for (const key in req.body) {
      if (!["aadharDetails", "panDetails"].includes(key)) {
        updateData[key] = req.body[key];
      }
    }

    if (req.files?.aadharImage) {
      updateData["aadharDetails.aadharImage"] =
        req.files.aadharImage[0].path.replace(/\\/g, "/");
    }

    if (req.files?.panImage) {
      updateData["panDetails.panImage"] = req.files.panImage[0].path.replace(
        /\\/g,
        "/"
      );
    }

    if (req.files?.profileImageUrl) {
      updateData.profileImageUrl = req.files.profileImageUrl[0].path.replace(
        /\\/g,
        "/"
      );
    }

    if (req.body["aadharDetails.aadharNumber"]) {
      updateData["aadharDetails.aadharNumber"] =
        req.body["aadharDetails.aadharNumber"];
    }
    if (req.body["aadharDetails.aadharName"]) {
      updateData["aadharDetails.aadharName"] =
        req.body["aadharDetails.aadharName"];
    }

    if (req.body["panDetails.panNumber"]) {
      updateData["panDetails.panNumber"] = req.body["panDetails.panNumber"];
    }
    if (req.body["panDetails.panName"]) {
      updateData["panDetails.panName"] = req.body["panDetails.panName"];
    }

    const updated = await DeliveryPartener.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Delivery Partner not found.",
      });
    }
    // await redis.del("deliveryPartnersCache");

    res.status(200).json({
      success: true,
      message: "Delivery Partner updated.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update.",
      error: error.message,
    });
  }
};

export const deleteDeliveryPartner = async (req, res) => {
  try {
    const deleted = await DeliveryPartener.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery Partner not found." });
    }
    // await redis.del("deliveryPartnersCache");
    res
      .status(200)
      .json({ success: true, message: "Delivery Partner deleted." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete.",
      error: error.message,
    });
  }
};

export const updateDeliveryPartnerStatus = async (req, res) => {
  try {
    const { onlineStatus } = req.body;
    const updatedPartner = await DeliveryPartener.findByIdAndUpdate(
      req.params.id,
      { onlineStatus },
      { new: true }
    );

    if (!updatedPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery Partner not found.",
      });
    }
    // await redis.del("deliveryPartnersCache");
    res.status(200).json({
      success: true,
      message: "Delivery Partner status updated.",
      onlineStatus: updatedPartner.onlineStatus,
    });
  } catch (error) {
    console.error("Error updating delivery partner status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const updateDeliveryPartnerOnboardingStatus = async (req, res) => {
  try {
    const { onboardingStatus } = req.body;
    const updatedPartner = await DeliveryPartener.findByIdAndUpdate(
      req.params.id,
      { onboardingStatus },
      { new: true }
    );

    if (!updatedPartner) {
      return res.status(404).json({
        success: false,
        message: "Delivery Partner not found.",
      });
    }
    // await redis.del("deliveryPartnersCache");
    res.status(200).json({
      success: true,
      message: "Delivery Partner onboarding status updated.",
      onboardingStatus: updatedPartner.onboardingStatus,
    });
  } catch (error) {
    console.error("Error updating delivery partner onboarding status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const verifyDeliveryPartnerOtp = async (req, res) => {
  try {
    const { deliveryPartnerId, date, type, otp } = req.body;

    if (!deliveryPartnerId || !date || !type || !otp) {
      return res.status(400).json({
        status: false,
        msg: "Missing required fields",
      });
    }

    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(sessionDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const otpRecord = await OtpSession.findOne({
      deliveryPartnerId,
      date: { $gte: sessionDate, $lt: nextDay },
    });

    if (!otpRecord) {
      return res.status(404).json({
        status: false,
        msg: "No OTP record found for this partner on the given date",
      });
    }

    let isValid = false;

    if (type === "start") {
      isValid = otp === otpRecord.sessionStartOtp;
    } else if (type === "end") {
      isValid = otp === otpRecord.sessionEndOtp;
    } else {
      return res.status(400).json({
        status: false,
        msg: "Invalid type. Must be 'start' or 'end'.",
      });
    }
    // await redis.del("deliveryPartnersCache");
    return res.status(200).json({
      status: isValid,
      msg: isValid ? "OTP matched successfully" : "Invalid OTP",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      status: false,
      msg: "Internal server error",
    });
  }
};

export const getDeliveryPartnersByFranchiseId = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    if (!franchiseId) {
      return res
        .status(400)
        .json({ success: false, message: "Franchise ID is required" });
    }
    console.log("Fetching delivery partners for franchise ID:", franchiseId);
    const deliveryPartners = await DeliveryPartener.find({
      assignedBranchId: franchiseId,
    });
    // await redis.del("deliveryPartnersCache");
    res.json({ success: true, deliveryPartners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const setDelivered = async (req, res) => {
  try {
    const {
      orderType,
      orderId,
      deliveryPartnerId,
      earnedByDelivery,
      deliveryImage,
      deliveryDate,
      deliveryTime,
      isBoxPicked,
      isBoxCleaned,
      status,
    } = req.body;

    const OrderModel =
      orderType === "subscription" ? SubscriptionOrders : productOrders;
    const order = await OrderModel.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.deliveryStatus = status;
    order.deliveryDetails = {
      deliveryPartnerId,
      earnedByDelivery,
      deliveryImage,
      deliveryDate,
      deliveryTime,
      isBoxPicked,
      isBoxCleaned,
    };

    // ✅ Fix: Proper wallet update
    const user = await User.findById(deliveryPartnerId);
    if (user) {
      user.wallet = (user.wallet || 0) + earnedByDelivery;
      await user.save();
    }


    // ✅ Update amountEarnedByDeliveryPartner in ProductOrders if orderType is 'product'

    const productOrdersFind = await productOrders.findById(orderId);
    if (productOrdersFind) {
      productOrdersFind.amountEarnedByDeliveryPartner = earnedByDelivery;
      await productOrdersFind.save();
    }

    // Add next delivery if failed
    if (status === "failed" && orderType === "subscription") {
      const nextDate = await getNextValidDate();
      order.deliveryDates.push(nextDate);
    }

    await order.save();
    // await redis.del("deliveryPartnersCache");
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getNextValidDate = () => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);
  return currentDate.toISOString().split("T")[0];
};
export const markOrderDelivered = async (req, res) => {
  try {
    const {
      orderId,
      deliveryPartnerId,
      earnedByDelivery,
      deliveryImage,
      deliveryDate,
      deliveryTime,
      isBoxPicked,
      isBoxCleaned,
      status,
      isSubscription = false,
    } = req.body;

    if (!isBoxPicked || !isBoxCleaned) {
      const boxReview = new BoxReview({
        orderId,
        deliveryPartnerId,
        deliveryDate,
        deliveryTime,
        isBoxPicked,
        isBoxCleaned,
        status

      });
      await boxReview.save();
    }


    if (!orderId || !status || !deliveryPartnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields!" });
    }

    const earned = parseInt(earnedByDelivery);
    const walletAmt = Math.floor(earned * 0.9);
    const incentiveAmt = Math.floor(earned * 0.1);

    // Fetch delivery partner
    const partner = await DeliveryPartener.findById(deliveryPartnerId);
    if (!partner)
      return res
        .status(404)
        .json({ success: false, message: "Delivery Partner not found" });

    if (isSubscription) {
      const order = await SubscriptionOrders.findById(orderId);
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Subscription Order not found" });

      const deliveryObj = order.orders?.[0]?.deliveryDates?.find(
        (d) =>
          new Date(d.date).toISOString().split("T")[0] ===
          new Date(deliveryDate).toISOString().split("T")[0]
      );
      const deliveryPartnerObj = order.orders?.[0]?.deliveryDates?.find(
        (d) => d.deliveryPartnerId?.toString() === deliveryPartnerId
      );

      if (!deliveryObj)
        return res
          .status(404)
          .json({ success: false, message: "Date not found in delivery" });
      // if (!deliveryPartnerObj) return res.status(404).json({ success: false, message: "Delivery Partner not found in delivery" });

      Object.assign(deliveryObj, {
        status,
        deliveryImage,
        deliveryTime,
        isBoxPicked,
        isBoxCleaned,
        earnedByDelivery,
      });

      if (status === "Delivered") {
        order.remainingDays = Math.max(0, order.remainingDays - 1); // Subtract 1 from remainingDays if successful
        if (order.remainingDays === 0) {
          order.status = "Expired"; // Change status to expired if remainingDays is 0
        }

        partner.wallet = (partner.wallet || 0) + walletAmt;
        partner.incentive = (partner.incentive || 0) + incentiveAmt;
        await partner.save();
      }

      if (status === "Failed") {
        const nextDate = getNextValidDate(); // Get the next valid delivery date
        order.orders[0].deliveryDates.push({
          date: nextDate,
          status: "Pending",
        });
      }

      await order.save();
      return res.json({ success: true, order });
    } else {
      const order = await productOrders.findById(orderId);
      console.log(order)
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: "Product Order not found" });

      Object.assign(order, {
        status,
        deliveryImage,
        deliveryTime,
        isBoxPicked,
        isBoxCleaned,
        amountEarnedByDeliveryPartner: earnedByDelivery, // ✅ correct field name
      });

      if (status === "Delivered") {
        order.remainingDays = Math.max(0, order.remainingDays - 1); // Subtract 1 from remainingDays if successful
        if (order.remainingDays === 0) {
          order.status = "Expired"; // Change status to expired if remainingDays is 0
        }

        partner.wallet = (partner.wallet || 0) + walletAmt;
        partner.incentive = (partner.incentive || 0) + incentiveAmt;
        await partner.save();
      }

      if (status === "Failed") {
        const nextDate = getNextValidDate(); // Get the next valid delivery date
        order.rescheduledDeliveryDates = order.rescheduledDeliveryDates || [];
        order.rescheduledDeliveryDates.push({
          date: nextDate,
          status: "Pending",
        });
      }

      await order.save();
      // await redis.del("deliveryPartnersCache");
      return res.json({ success: true, order });
    }
  } catch (err) {
    console.error("Error while marking order as delivered:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getDeliveryPartnerStats = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;
    const { type, monthNumber, year } = req.body;

    if (!deliveryPartnerId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing delivery partner ID" });
    }

    if (!type || !year || (type === "monthly" && !monthNumber)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request body" });
    }

    const getAllDatesInRange = (start, end) => {
      const dates = [];
      const current = new Date(start);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };

    const extractDeliveryDates = (subs) =>
      subs.flatMap((s) =>
        s.orders.flatMap((o) =>
          o.deliveryDates.filter(
            (d) => d.deliveryPartnerId?.toString() === deliveryPartnerId
          )
        )
      );

    const formatDate = (date) => moment(date).format("D MMM");
    const formatFullDate = (date) => moment(date).format("YYYY-MM-DD");

    if (type === "monthly") {
      const startOfMonth = moment({ year, month: monthNumber - 1 })
        .startOf("month")
        .toDate();
      const endOfMonth = moment({ year, month: monthNumber - 1 })
        .endOf("month")
        .toDate();

      const startOfMonthStr = moment({ year, month: monthNumber - 1 })
        .startOf("month")
        .format("YYYY-MM-DD");
      const endOfMonthStr = moment({ year, month: monthNumber - 1 })
        .endOf("month")
        .format("YYYY-MM-DD");

      const productOrdersList = await productOrders.find({
        deliveryPartnerId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const subscriptionOrders = await SubscriptionOrders.find({
        "orders.deliveryDates.deliveryPartnerId": deliveryPartnerId,
        "orders.deliveryDates.date": {
          $gte: startOfMonthStr,
          $lte: endOfMonthStr,
        },
      });

      console.log("startOfMonth:", startOfMonth);
      console.log("endOfMonth:", endOfMonth);
      console.log("startOfMonthStr:", startOfMonthStr);
      console.log("endOfMonthStr:", endOfMonthStr);

      console.log("Product orders found:", productOrdersList.length);
      console.log("Subscription orders found:", subscriptionOrders.length);

      // const allDeliveryDates = extractDeliveryDates(subscriptionOrders);

      const attendanceData = await Attendance.find({
        DeliveryPartnerId: deliveryPartnerId,
        type: "delivery-partner",
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const allDeliveryDates = extractDeliveryDates(subscriptionOrders);
      console.log("Extracted deliveryDates count:", allDeliveryDates.length);
      // Group data by date
      const dateStats = {};

      for (const order of productOrdersList) {
        const dateKey = formatFullDate(order.createdAt);
        if (!dateStats[dateKey]) {
          dateStats[dateKey] = {
            earn: 0,
            totalBoxDelivered: 0,
            present: false,
          };
        }
        if (order.status === "Delivered") {
          dateStats[dateKey].earn += order.amountEarnedByDeliveryPartner || 0;
          dateStats[dateKey].totalBoxDelivered++;
        }
        if (order.attendanceStatus === "present") {
          dateStats[dateKey].present = true;
        }
      }

      for (const date of allDeliveryDates) {
        const dateKey = formatFullDate(date.date);
        if (!dateStats[dateKey]) {
          dateStats[dateKey] = {
            earn: 0,
            totalBoxDelivered: 0,
            present: false,
          };
        }
        if (date.status === "Delivered") {
          dateStats[dateKey].earn += date.earnedByDelivery || 0;
          dateStats[dateKey].totalBoxDelivered++;
        }
        if (date.attendanceStatus === "present") {
          dateStats[dateKey].present = true;
        }
      }

      for (const record of attendanceData) {
        const dateKey = formatFullDate(record.date);
        if (!dateStats[dateKey]) {
          dateStats[dateKey] = { earn: 0, totalBoxDelivered: 0, present: false };
        }
        if (record.status === 'present') {
          dateStats[dateKey].present = true;
        }
      }

      // Totals
      let totalEarned = 0;
      let totalBoxDelivered = 0;
      let presentDays = 0;
      let absentDays = 0;

      Object.values(dateStats).forEach(stat => {
        totalEarned += stat.earn;
        totalBoxDelivered += stat.totalBoxDelivered;
        if (stat.present) presentDays++;
      });

      absentDays = attendanceData.filter(a => a.status === 'absent').length;

      const allDates = getAllDatesInRange(startOfMonth, endOfMonth).reverse();
      const today = moment();

      const lastWeekDates = allDates.filter((d) =>
        moment(d).isSameOrAfter(today.clone().subtract(6, "days"), "day")
      );
      const monthWeekChunks = [];
      let tempChunk = [];

      for (let i = allDates.length - 1; i >= 0; i--) {
        const day = allDates[i];
        tempChunk.push(day);
        if (tempChunk.length === 7 || i === 0) {
          monthWeekChunks.push([...tempChunk].reverse());
          tempChunk = [];
        }
      }

      const makeDataObj = (datesArray) => ({
        dateFrom: `${formatDate(datesArray[0])} to ${formatDate(
          datesArray[datesArray.length - 1]
        )}`,
        data: datesArray
          .map((date) => {
            const key = formatFullDate(date);
            return {
              date: formatDate(date),
              earn: dateStats[key]?.earn || 0,
              totalBoxDelivered: dateStats[key]?.totalBoxDelivered || 0,
              present: dateStats[key]?.present || false,
            };
          })
          .filter(
            (entry) =>
              entry.earn > 0 || entry.totalBoxDelivered > 0 || entry.present
          ),
      });

      const lastWeekData = makeDataObj(lastWeekDates);
      const monthWeeksData = monthWeekChunks
        .map((week) => makeDataObj(week))
        .filter((w) => w.data.length);

      return res.json({
        success: true,
        data: {
          month: moment(startOfMonth).format("MMMM"),
          lastWeekData,
          monthWeeksData,
          totalEarned,
          totalBoxDelivered,
          presentDays,
          absentDays
        },
      });
    }

    // Yearly data summary
    if (type === "yearly") {
      const monthlySummary = [];

      for (let m = 0; m < 12; m++) {
        const startOfMonth = moment({ year, month: m })
          .startOf("month")
          .toDate();
        const endOfMonth = moment({ year, month: m }).endOf("month").toDate();

        const productOrdersList = await productOrders.find({
          deliveryPartnerId,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const subscriptionOrders = await SubscriptionOrders.find({
          "orders.deliveryDates.deliveryPartnerId": deliveryPartnerId,
          "orders.deliveryDates.date": { $gte: startOfMonth, $lte: endOfMonth },
        });

        const allDeliveryDates = extractDeliveryDates(subscriptionOrders);

        const totalEarning =
          productOrdersList.reduce(
            (sum, o) => sum + (o.amountEarnedByDeliveryPartner || 0),
            0
          ) +
          allDeliveryDates.reduce(
            (sum, d) => sum + (d.earnedByDelivery || 0),
            0
          );

        const totalBoxDelivered =
          productOrdersList.filter((o) => o.status === "Delivered").length +
          allDeliveryDates.filter((d) => d.status === "Delivered").length;

        const presentDays =
          productOrdersList.filter((o) => o.attendanceStatus === "present")
            .length +
          allDeliveryDates.filter((d) => d.attendanceStatus === "present")
            .length;

        monthlySummary.push({
          month: moment(startOfMonth).format("MMMM"),
          totalEarning,
          totalBoxDelivered,
          presentDays,
        });
      }

      return res.json({ success: true, data: { year, monthlySummary } });
    }
    // await redis.del("deliveryPartnersCache");
    return res
      .status(400)
      .json({ success: false, message: "Invalid type specified" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDeliveryPartnerPayoutData = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    if (!deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: "Delivery partner ID is required",
      });
    }

    const productOrdersList = await productOrders.find({
      deliveryPartnerId,
      status: "Delivered",
    });

    const totalEarningsFromProductOrders = productOrdersList.reduce(
      (sum, order) => sum + (order.amountEarnedByDeliveryPartner || 0),
      0
    );

    const subscriptionOrders = await SubscriptionOrders.find({
      "orders.deliveryDates.deliveryPartnerId": deliveryPartnerId,
    });

    console.log("Subscription Orders:", subscriptionOrders.length);

    let deliveredSubscriptionDates = [];

    for (const subscription of subscriptionOrders) {
      for (const order of subscription.orders) {
        const matchingDates = order.deliveryDates.filter(
          (d) =>
            d.deliveryPartnerId?.toString() === deliveryPartnerId &&
            d.status === "Delivered"
        );
        deliveredSubscriptionDates.push(...matchingDates);
      }
    }

    console.log("Delivered Subscription Dates:", deliveredSubscriptionDates.length);

    const totalEarningsFromSubscriptionOrders =
      deliveredSubscriptionDates.reduce(
        (sum, d) => sum + (d.amountEarnedByDeliveryPartner || 0),
        0
      );

    const deliveryPartner = await DeliveryPartener.findById(deliveryPartnerId);
    const totalIncentives = deliveryPartner?.incentive || 0;

    const totalDeductions = 0;



    const totalPayout =
      totalEarningsFromProductOrders +
      totalEarningsFromSubscriptionOrders -
      totalDeductions;

    // await redis.del("deliveryPartnersCache");

    res.json({
      success: true,
      data: {
        totalEarningsFromProductOrders,
        totalEarningsFromSubscriptionOrders,
        totalIncentives,
        totalDeductions,
        totalPayout,
      },
    });
  } catch (err) {
    console.error("Error fetching delivery partner payout data:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};