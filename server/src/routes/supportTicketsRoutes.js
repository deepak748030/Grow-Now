import express from "express";
import {
    createTicket,
    getUserTickets,
    getTicketById,
    updateTicketStatus,
    deleteTicket,
} from "../controllers/supportTicketsController.js";

const router = express.Router();

// @route   POST /api/support-tickets
// @desc    Create a new support ticket
router.post("/", createTicket);

// @route   GET /api/support-tickets
// @desc    Get all tickets for logged-in user
router.get("/", getUserTickets);

// @route   GET /api/support-tickets/:id
// @desc    Get a single ticket by ID
router.get("/:id", getTicketById);

// @route   PATCH /api/support-tickets/:id/status
// @desc    Update ticket status (Admin/Support Role)
// @access  Private (Admin Only)
router.patch("/:id/status", updateTicketStatus);

// @route   DELETE /api/support-tickets/:id
// @desc    Delete a support ticket
router.delete("/:id", deleteTicket);

export default router;
