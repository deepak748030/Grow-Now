import SupportTickets from "../models/SupportTickets.js";

// @desc    Create a new support ticket
// @route   POST /api/support-tickets
// @access  Private
export const createTicket = async (req, res) => {
    try {
        const { title, description, type, orderIdOrTrxId } = req.body;
        if (!title || !type) {
            return res.status(400).json({ error: "Title and Type are required" });
        }

        const ticket = new SupportTickets({
            title,
            description,
            type,
            status: "pending",
            userId: req.user._id,
            orderIdOrTrxId,
        });

        await ticket.save();
        res.status(201).json({ message: "Support ticket created successfully", ticket });
    } catch (error) {
        console.error("Error creating support ticket:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// @desc    Get all tickets for a user
// @route   GET /api/support-tickets
// @access  Private
export const getUserTickets = async (req, res) => {
    try {
        const tickets = await SupportTickets.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// @desc    Get a single ticket by ID
// @route   GET /api/support-tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTickets.findOne({ _id: req.params.id, userId: req.user._id });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.json(ticket);
    } catch (error) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// @desc    Update ticket status (Admin/Support Role)
// @route   PATCH /api/support-tickets/:id/status
// @access  Private (Admin Only)
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["pending", "in progress", "resolved", "closed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status update" });
        }

        const ticket = await SupportTickets.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        ticket.status = status;
        await ticket.save();

        res.json({ message: "Ticket status updated successfully", ticket });
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// @desc    Delete a support ticket
// @route   DELETE /api/support-tickets/:id
// @access  Private
export const deleteTicket = async (req, res) => {
    try {
        const ticket = await SupportTickets.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found or unauthorized" });
        }

        res.json({ message: "Ticket deleted successfully" });
    } catch (error) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
