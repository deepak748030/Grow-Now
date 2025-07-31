import Franchise from "../models/Franchise.js";
import User from "../models/User.js";
import SubscriptionOrder from "../models/SubscriptionOrders.js";
import crypto from "crypto";
import Transaction from "../models/Transaction.js";

// Generate a unique referral code
const generateUniqueReferralCode = async () => {
  try {
    while (true) {
      const referCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      const existingUser = await User.exists({ referCode });
      if (!existingUser) return referCode;
    }
  } catch (error) {
    console.error("Error generating referral code:", error);
    throw new Error("Failed to generate referral code.");
  }
};

// ✅ Create or Return Existing User
// export const createUser = async (req, res) => {
//     try {
//         const { mobileNumber } = req.body;
//         const {role} = req.body; // Extract role from request body

//         // Validate Mobile Number
//         if (!mobileNumber) {
//             return res.status(400).json({ success: false, error: "Mobile number is required." });
//         }

//         // Check if User Already Exists
//         const existingUser = await User.findOne({ mobileNumber }).lean();
//         if (existingUser) {
//             return res.status(200).json({ success: true, message: "User already exists.", data: existingUser });
//         }

//         // Generate Unique Referral Code
//         const referCode = await generateUniqueReferralCode();

//         // Create and Save User
//         // if (role === "manager") {
//         //     const existingManager = await User.findOne({ role: "manager" }).lean();
//         //     if (existingManager) {
//         //         return res.status(400).json({ success: false, error: "Manager already exists." });
//         //     }
//         // }
//         const userRole = role === "manager" ? "manager" : "user"; // Set role based on request body
//         const user = new User({ mobileNumber, referCode, role: userRole });
//         await user.save();

//         res.status(201).json({ success: true, message: "User created successfully!", data: user });
//     } catch (error) {
//         console.error("Error creating user:", error);

//         // Handle Mongoose Validation Errors
//         if (error.name === "ValidationError") {
//             const messages = Object.values(error.errors).map((val) => val.message);
//             return res.status(400).json({ success: false, error: messages.join(", ") });
//         }

//         res.status(500).json({ success: false, error: "Internal Server Error" });
//     }
// };

export const createUser = async (req, res) => {
  try {
    const { mobileNumber, role } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: "Mobile number is required." });
    }

    const existingUser = await User.findOne({ mobileNumber });

    // If user already exists
    if (existingUser) {
      if (role && existingUser.role !== role) {
        return res.status(403).json({
          success: false,
          error: `This mobile number is registered as a ${existingUser.role || 'user'}. You can't log in as a ${role}.`
        });
      }

      let data = existingUser.toObject();

      if (existingUser.role === "manager") {
        const franchise = await Franchise.findOne({ assignedManager: existingUser._id }).lean();
        data.franchiseId = franchise?._id || null;
      }

      return res.status(200).json({ success: true, message: "Login successful.", data });
    }

    if (role === "manager") {
      return res.status(403).json({ success: false, error: "Manager not found!" });
    }

    const referCode = await generateUniqueReferralCode();
    const user = new User({ mobileNumber, referCode, role: "user" });

    await user.save();

    res.status(201).json({ success: true, message: "User created successfully!", data: user });

  } catch (error) {
    console.error("Error creating user:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, error: messages.join(", ") });
    }

    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const createManager = async (req, res) => {
  try {
    const { mobileNumber, name } = req.body; // Admin will send manager mobileNumber and optional name

    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: "Mobile number is required." });
    }

    // Check if manager with this mobile already exists
    const existingManager = await User.findOne({ mobileNumber });

    if (existingManager) {
      if (existingManager.role === "manager") {
        return res.status(400).json({ success: false, error: "Manager already exists with this mobile number." });
      } else {
        return res.status(400).json({ success: false, error: `This mobile number is already registered as a ${existingManager?.role || 'user'}.` });
      }
    }

    const referCode = await generateUniqueReferralCode();

    const newManager = new User({
      mobileNumber,
      referCode,
      role: "manager",
      name: name || "",
    });

    await newManager.save();

    res.status(201).json({ success: true, message: "Manager created successfully.", data: newManager });

  } catch (error) {
    console.error("Error creating manager:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, error: messages.join(", ") });
    }

    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


export const getAllManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: "manager" }).lean();
    if (!managers || managers.length === 0) {
      return res.status(404).json({ success: false, error: "No managers found" });
    }

    res.status(200).json({ success: true, data: managers });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the manager exists and has the role "manager"
    const manager = await User.findOne({ _id: id, role: "manager" });
    if (!manager) {
      return res.status(404).json({ success: false, error: "Manager not found" });
    }

    // Delete the manager
    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Manager deleted successfully!" });
  } catch (error) {
    console.error("Error deleting manager:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ✅ Get User by ID with Lean Query
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: "Invalid User ID" });
  }
};

// ✅ Update User with Strict Validation
export const updateUser = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.mobileNumber || updates.email) {
      const existingUser = await User.findOne({
        $or: [{ mobileNumber: updates.mobileNumber }, { email: updates.email }],
        _id: { $ne: req.params.id },
      }).select("_id").lean();

      if (existingUser) {
        return res.status(400).json({ success: false, error: "Mobile number or email already in use." });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true, lean: true });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, message: "User updated successfully!", data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: "Invalid Update Data" });
  }
};

// Update only dob name and gender of the user
export const updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dob, gender } = req.body;
    const updateData = {
      ...(name && { name }),
      ...(dob && { dob }),
      ...(gender && { gender }),
    };

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully!",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Invalid Update Data",
    });
  }
};

// ✅ Delete User with Validation
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    res.status(400).json({ success: false, error: "Invalid User ID" });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2000;
    const skip = (page - 1) * limit;

    // Get total counts for all users and all customers (not just paginated)
    const [totalUsersCount, totalCustomerCount] = await Promise.all([
      User.countDocuments(),
      SubscriptionOrder.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$userID",
            latestOrder: { $first: "$$ROOT" }
          }
        },
        { $match: { "latestOrder.paymentType": "ONLINE" } },
        { $count: "totalCustomer" }
      ]).then(arr => arr[0]?.totalCustomer || 0)
    ]);

    // Paginated users with assignedFranchiseId populated (only name and cityName)
    const users = await User.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "assignedFranchiseId",
        select: "name cityName"
      })
      .lean();

    const userIds = users.map(user => user._id);

    const latestOrders = await SubscriptionOrder.aggregate([
      { $match: { userID: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userID",
          latestOrder: { $first: "$$ROOT" }
        }
      },
      {
        $project: {
          userID: "$_id",
          paymentType: "$latestOrder.paymentType",
          remainingDays: "$latestOrder.remainingDays"
        }
      }
    ]);

    const orderMap = {};
    latestOrders.forEach(order => {
      orderMap[order.userID.toString()] = {
        paymentType: order.paymentType,
        remainingDays: order.remainingDays
      };
    });

    const result = users.map(user => {
      const orderInfo = orderMap[user._id.toString()];
      let tag;
      if (orderInfo) {
        if (orderInfo.remainingDays < 1) {
          tag = "expired";
        } else {
          if (orderInfo.paymentType === "ONLINE") {
            tag = "customer";
          } else {
            tag = orderInfo.paymentType ? orderInfo.paymentType.toLowerCase() : "user";
          }
        }
      } else {
        tag = "user";
      }
      return { ...user, tag };
    });

    res.json({
      success: true,
      totalUsers: totalUsersCount,
      totalCustomer: totalCustomerCount,
      data: result
    });
  } catch (error) {
    console.error("Error in getAllUser:", error);
    res.status(400).json({ success: false, error: "Invalid request" });
  }
};


// PATCH: Assign a franchise to a user
export const assignFranchiseToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { franchiseId } = req.body;

    if (!userId || !franchiseId) {
      return res.status(400).json({ success: false, error: "userId and franchiseId are required." });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Check if franchise exists
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      return res.status(404).json({ success: false, error: "Franchise not found." });
    }

    // Assign franchise to user (using assignedFranchiseId field)
    user.assignedFranchiseId = franchiseId;
    await user.save();

    res.status(200).json({ success: true, message: "Franchise assigned to user successfully.", data: user });
  } catch (error) {
    console.error("Error assigning franchise to user:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.blocked = !user.blocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.blocked ? "blocked" : "unblocked"} successfully.`,
      data: user,
    });
  } catch (error) {
    console.error("Error toggling user block status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const addBalanceToUser = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || !reason) {
      return res.status(400).json({ success: false, message: "User ID, amount, and reason are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.wallet = (user.wallet || 0) + amount;
    await user.save();

    const transaction = new Transaction({
      userId,
      amount,
      type: "credit",
      category: "addmoney",
      status: "success",
      title: "Balance Added",
      description: reason,
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} added to user's wallet successfully.`,
      data: user,
    });
  } catch (error) {
    console.error("Error adding balance to user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
