import Setting from "../models/Setting.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// ✅ Utility function to handle responses & errors
const handleResponse = (res, statusCode, success, data, message) => {
    return res.status(statusCode).json({ success, data, message });
};

// 🟢 Create Transaction
export const createTransaction = async (req, res) => {
    try {
        const { title, amount, type, category } = req.body;

        // ✅ Validate required fields
        if (!title || !amount || !type) {
            return handleResponse(res, 400, false, null, "Missing required fields: title, amount, or type.");
        }

        // ✅ Create and save transaction
        const transaction = new Transaction(req.body);
        await transaction.save();

        return handleResponse(res, 201, true, transaction, "Transaction created successfully.");
    } catch (error) {
        return handleResponse(res, 500, false, null, error.message);
    }
};

// 🔵 Get All Transactions
export const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().lean(); // ✅ Use lean() for performance

        if (!transactions.length) {
            return handleResponse(res, 404, false, [], "No transactions found.");
        }

        return handleResponse(res, 200, true, transactions, "Transactions fetched successfully.");
    } catch (error) {
        return handleResponse(res, 500, false, null, error.message);
    }
};

// 🟣 Get Transaction by ID
export const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).lean();

        if (!transaction) {
            return handleResponse(res, 404, false, null, "Transaction not found.");
        }

        return handleResponse(res, 200, true, transaction, "Transaction fetched successfully.");
    } catch (error) {
        return handleResponse(res, 500, false, null, error.message);
    }
};

// 🟠 Full Update (PUT) - Replace Entire Transaction
export const updateTransaction = async (req, res) => {
    try {
        const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).lean();

        if (!updatedTransaction) {
            return handleResponse(res, 404, false, null, "Transaction not found.");
        }

        return handleResponse(res, 200, true, updatedTransaction, "Transaction updated successfully.");
    } catch (error) {
        return handleResponse(res, 500, false, null, error.message);
    }
};

// 🟡 Partial Update (PATCH) - Update Specific Fields
export const patchTransaction = async (req, res) => {
    try {
        if (!Object.keys(req.body).length) {
            return handleResponse(res, 400, false, null, "No data provided for update.");
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { $set: req.body }, {
            new: true,
            runValidators: true
        }).lean();

        if (!updatedTransaction) {
            return handleResponse(res, 404, false, null, "Transaction not found.");
        }

        return handleResponse(res, 200, true, updatedTransaction, "Transaction updated successfully.");
    } catch (error) {
        return handleResponse(res, 500, false, null, error.message);
    }
};

// 🔴 Delete Transaction
export const deleteTransaction = async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id).lean();

        if (!deletedTransaction) {
            return handleResponse(res, 404, false, null, "Transaction not found.");
        }

        return handleResponse(res, 200, true, null, "Transaction deleted successfully.");
    } catch (error) {
        return handleResponse(res, 500, false, null, error.message);
    }
};

// 🟤 Get Transactions by User ID
export const getTransactionsByUserId = async (req, res) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
  
      const filter = { userId: { $exists: true, $eq: userId } };
  
      const [transactions, total] = await Promise.all([
        Transaction.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Transaction.countDocuments(filter),
      ]);
  
      res.json({
        success: true,
        data: transactions,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          limit,
        },
      });
    } catch (err) {
      console.error("Error fetching user transactions:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
};  

//Add money to wallet
export const addMoneyToWallet = async (req, res) => {
    try {
      const { userId, amount } = req.body;
  
      if (!userId || !amount) {
        return res.status(400).json({ message: "userId and amount are required" });
      }
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Get settings from DB
      const settings = await Setting.findOne();
      const minAddMoney = settings?.minAddMoney || 0;
      const rechargeOptions = settings?.rechargeOptions || [];
  
      // Check minimum amount
      if (amount < minAddMoney) {
        return res.status(400).json({
          message: `Minimum recharge amount is ₹${minAddMoney}`,
        });
      }
  
      let cashback = 0;
      rechargeOptions.sort((a, b) => a.amount - b.amount); // Sort for safety
  
      for (let i = 0; i < rechargeOptions.length; i++) {
        const current = rechargeOptions[i];
        const next = rechargeOptions[i + 1];
  
        const isLast = i === rechargeOptions.length - 1;
  
        if (
          (amount >= current.amount && amount < (next?.amount || Infinity)) ||
          (isLast && amount >= current.amount)
        ) {
          cashback = current.cashback;
          break;
        }
      }
  
      // Add to wallet & bonus
      user.wallet += amount;
      if (cashback > 0) {
        user.bonusWallet = (user.bonusWallet || 0) + cashback;
      }
  
      await user.save();
  
      // Record the transaction
      await Transaction.create({
        userId,
        title: "Wallet Top-Up",
        description: `Added ₹${amount} to wallet${cashback ? ` with ₹${cashback} cashback` : ""}`,
        amount,
        type: "credit",
        category: "addmoney",
        status: "success",
      });
  
      res.json({
        message: `₹${amount} added to wallet successfully${cashback ? `, ₹${cashback} cashback added to bonus wallet` : ""}`,
        newWalletBalance: user.wallet,
        newBonusWalletBalance: user.bonusWallet,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add money to wallet" });
    }
};