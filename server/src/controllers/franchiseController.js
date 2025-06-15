import Franchise from "../models/Franchise.js";
import { getDistance } from "geolib";
import OtpSession from "../models/OtpSession.js";
import SubscriptionOrders from "../models/SubscriptionOrders.js";
import productOrders from "../models/productOrders.js";
// import redis from '../redis/redisClient.js'

// POST /franchise
export const createFranchise = async (req, res) => {
  try {
    const {
      name,
      cityName,
      branchName,
      totalDeliveryRadius,
      freeDeliveryRadius,
      chargePerExtraKm,
      assignedManager,
      polygonCoordinates,
      location
    } = req.body;
    if (
      !name ||
      !cityName ||
      !branchName ||
      !totalDeliveryRadius ||
      !freeDeliveryRadius ||
      !chargePerExtraKm ||
      !assignedManager ||
      !polygonCoordinates ||
      !Array.isArray(polygonCoordinates) ||
      polygonCoordinates.length === 0
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newFranchise = new Franchise({
      name,
      cityName,
      branchName,
      location,
      totalDeliveryRadius,
      freeDeliveryRadius,
      chargePerExtraKm,
      assignedManager,
      polygonCoordinates,
    });

    await newFranchise.save();
    // await redis.del('franchises');
    res
      .status(201)
      .json({ message: "Franchise created successfully", data: newFranchise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create franchise" });
  }
};

// GET /franchise
export const getFranchises = async (_, res) => {
  try {
    // const cacheFranchises = await redis.get("franchises");
    // if (cacheFranchises) {
    //   return res.status(200).json({ data: JSON.parse(cacheFranchises) });
    // }
    const franchises = await Franchise.find().populate("assignedManager");
    // await redis.set('franchises', JSON.stringify(franchises), 'EX', 3600)
    res.status(200).json({ data: franchises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch franchises" });
  }
};

// GET /franchise/:id
export const getFranchiseById = async (req, res) => {
  const { id } = req.params;

  try {
    const franchise = await Franchise.findById(id).populate("assignedManager");

    if (!franchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }
    // await redis.del('franchises')
    res.status(200).json({ data: franchise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch franchise" });
  }
};

// PUT /franchise/:id
export const updateFranchise = async (req, res) => {
  const { id } = req.params;

  const {
    name,
    cityName,
    branchName,
    totalDeliveryRadius,
    freeDeliveryRadius,
    chargePerExtraKm,
    assignedManager,
    polygonCoordinates,
    location,
  } = req.body;

  try {
    if (
      !name ||
      !cityName ||
      !branchName ||
      !totalDeliveryRadius ||
      !freeDeliveryRadius ||
      !chargePerExtraKm ||
      !assignedManager ||
      !polygonCoordinates ||
      !Array.isArray(polygonCoordinates) ||
      polygonCoordinates.length === 0 ||
      !location
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updatedFranchise = await Franchise.findByIdAndUpdate(
      id,
      {
        name,
        cityName,
        branchName,
        location,
        totalDeliveryRadius,
        freeDeliveryRadius,
        chargePerExtraKm,
        assignedManager,
        polygonCoordinates,
      },
      { new: true }
    ).populate("assignedManager");

    if (!updatedFranchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    // await redis.del('franchises');
    res.status(200).json({
      message: "Franchise updated successfully",
      data: updatedFranchise,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update franchise" });
  }
};

// DELETE /franchise/:id
export const deleteFranchise = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFranchise = await Franchise.findByIdAndDelete(id);

    if (!deletedFranchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }
    // await redis.del('franchises')
    res.status(200).json({ message: "Franchise deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete franchise" });
  }
};


export const getOrdersByDate = async (req, res) => {
  try {
    const { franchiseId, date, type } = req.query;
    const targetDate = date;

    if (!franchiseId || !date) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Franchise ID and a valid date are required",
        });
    }

    if (type === "subscription") {
      const subscriptionOrders = await SubscriptionOrders.find({
        assignedFranchiseId: franchiseId,
        "orders.deliveryDates.date": targetDate,
      });
      const filteredOrders = subscriptionOrders.map(order => {
        // Step 2: Filter deliveryDates for the specific target date
        order.orders = order.orders.map(orderItem => ({
          ...orderItem,
          deliveryDates: orderItem.deliveryDates.filter(d => d.date === targetDate)
        }));
        return order;
      });
      return res.json({ success: true, "subscriptionOrders": filteredOrders });
    }

    if (type === "product") {
      const productOrderList = await productOrders.find({
        assignedFranchiseId: franchiseId,
        // orderDate: targetDate,
        status: { $in: ["Pending", "pending"] },
      });
      return res.json({ success: true, productOrderList });
    }

    // if not type given then fetch all orders
    // if not type given then fetch all orders
    const subscriptionOrders = await SubscriptionOrders.find({
      assignedFranchiseId: franchiseId,
      "orders.deliveryDates.date": targetDate,
    })
      .populate('orders.subscriptionId') // 👈 populate subscriptionId if needed
      .populate('orders.deliveryDates.deliveryPartnerId'); // 👈 populate deliveryPartnerId too
    ;

    const filteredOrders = subscriptionOrders.map(order => {
      // Step 2: Filter deliveryDates for the specific target date
      order.orders = order.orders.map(orderItem => ({
        ...orderItem,
        deliveryDates: orderItem.deliveryDates.filter(d => d.date === targetDate)
      }));
      return order;
    });

    // Manual population after fetching



    const productOrderList = await productOrders.find({
      assignedFranchiseId: franchiseId,
      // orderDate: targetDate,
      status: { $in: ["Pending", "pending"] },
    })
      .populate('productData') // 👈 populate productData field
      .populate('deliveryPartnerId'); // 👈 populate deliveryPartnerId field
    ;

    res.json({
      success: true,
      "subscriptionOrders": filteredOrders,
      productOrderList,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// POST /franchise/getFranchiseByLocation
export const getFranchiseByLocation = async (req, res) => {
  try {
    const { userLat, userLng } = req.body;

    // Fetch all franchises from the database
    const franchises = await Franchise.find(
      {},
      { createdAt: 0, updatedAt: 0, assignedManager: 0 }
    );

    const availableFranchises = franchises
      .map((franchise) => {
        const polygonCoordinates = franchise.polygonCoordinates;

        // Check if the user's location is inside the polygon
        const isInsidePolygon = polygonCoordinates.some((coordinate, index) => {
          const nextIndex = (index + 1) % polygonCoordinates.length;
          const x1 = coordinate.lng;
          const y1 = coordinate.lat;
          const x2 = polygonCoordinates[nextIndex].lng;
          const y2 = polygonCoordinates[nextIndex].lat;

          const intersect =
            y1 > userLat !== y2 > userLat &&
            userLng < ((x2 - x1) * (userLat - y1)) / (y2 - y1) + x1;

          return intersect;
        });

        if (isInsidePolygon) {
          const franchiseLat = franchise.polygonCoordinates[0].lat;
          const franchiseLng = franchise.polygonCoordinates[0].lng;

          // Calculate distance using geolib's getDistance function
          const distance = getDistance(
            { latitude: userLat, longitude: userLng },
            { latitude: franchiseLat, longitude: franchiseLng }
          );

          // Convert distance from meters to kilometers
          const distanceInKm = distance / 1000;

          // Initialize charge variable
          let charge = 0;

          // Apply charge only if user is beyond free delivery radius
          if (distanceInKm > franchise.freeDeliveryRadius) {
            const extraDistance = distanceInKm - franchise.freeDeliveryRadius;
            charge = extraDistance * franchise.chargePerExtraKm;
          }

          return {
            _id: franchise._id, // Include _id in the response
            franchise: franchise.name,
            cityName: franchise.cityName,
            branchName: franchise.branchName,
            location: franchise.location,
            deliveryDistance: distanceInKm,
            charge: charge, // Adding charge to the response
          };
        }

        // Return null if the user's location is outside the polygon
        return null;
      })
      .filter((franchise) => franchise !== null); // Remove null values where franchise is out of polygon

    // If no franchises are found within the delivery radius
    if (availableFranchises.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No available franchises for this location",
        });
    }

    res.json({
      success: true,
      data: availableFranchises,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getFranchiseByOTP = async (req, res) => {
  try {
    const { franchiseId } = req.params;

    if (!franchiseId) {
      return res.status(400).json({ success: false, message: "Franchise ID is required." });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const data = await OtpSession.find({
      branchId: franchiseId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      // .populate("deliveryPartnerId", "name mobileNumber")
      .populate("branchId", "name branchName location")
      .sort({ date: -1 });

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "No OTP sessions found for this franchise." });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch OTP sessions." });
  }
};

export const assignManagerForFranchise = async (req, res) => {
  try {
    const { franchiseId, managerId } = req.body;

    if (!franchiseId || !managerId) {
      return res.status(400).json({ message: "Franchise ID and Manager ID are required." });
    }

    const updatedFranchise = await Franchise.findByIdAndUpdate(
      franchiseId,
      { assignedManager: managerId },
      { new: true }
    ).populate("assignedManager");

    if (!updatedFranchise) {
      return res.status(404).json({ message: "Franchise not found" });
    }

    res.status(200).json({
      message: "Manager assigned to franchise successfully",
      data: updatedFranchise,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign manager to franchise" });
  }
}

export const getFranchiseByManagerId = async (req, res) => {
  try {
    const { managerId } = req.params;

    if (!managerId) {
      return res.status(400).json({ message: "Manager ID is required." });
    }

    const franchises = await Franchise.find({ assignedManager: managerId }).populate("assignedManager");

    if (!franchises || franchises.length === 0) {
      return res.status(404).json({ message: "No franchises found for this manager" });
    }

    res.status(200).json({ data: franchises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch franchises" });
  }
};