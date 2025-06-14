import express from "express";
import {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    patchTransaction,
    deleteTransaction,
    addMoneyToWallet,
    getTransactionsByUserId
} from "../controllers/transactionController.js";

const router = express.Router();

// 🟢 Create a Transaction
router.post("/", createTransaction);

// 🔵 Get All Transactions
router.get("/", getAllTransactions);

// 🟣 Get Transaction by ID
router.get("/:id", getTransactionById);

// 🟠 Full Update (PUT) - Replace Entire Transaction
router.put("/:id", updateTransaction);

// 🟡 Partial Update (PATCH) - Update Specific Fields
router.patch("/:id", patchTransaction);

// 🔴 Delete a Transaction
router.delete("/:id", deleteTransaction);

// Get all transactions for a specific user
router.get("/user/:userId", getTransactionsByUserId);

// Add money to a user's wallet
router.post('/add-money', addMoneyToWallet);

export default router;
