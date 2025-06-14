import DeliveryPartner from "../models/DeliveryPartener.js";
import PayoutTransaction from "../models/PayoutTransaction.js";

const generateTransactionId = () => {
    return `TRX${Math.floor(100000 + Math.random() * 900000)}`; // TRX followed by 6 digits
};

export const requestPayout = async (req, res) => {
    try {
      const { monthName, date, amount, deliveryPartnerId } = req.body;
  
      if (!monthName || !date || !amount || !deliveryPartnerId) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }
  
      const partner = await DeliveryPartner.findById(deliveryPartnerId);
      if (!partner) {
        return res.status(404).json({ success: false, message: "Delivery Partner not found." });
      }
  
      if (partner.wallet < amount) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
      }
  
      // Deduct from wallet
      partner.wallet -= amount;
      await partner.save();
  
      // Create payout transaction
      const payout = new PayoutTransaction({
        transactionId: generateTransactionId(),
        monthName,
        date,
        amount,
        deliveryPartnerId,
      });
  
      await payout.save();
  
      return res.status(201).json({
        success: true,
        message: "Payout successful.",
        data: payout,
      });
  
    } catch (error) {
      console.error("Payout error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export const getPayoutByDeliveryPartnerId = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    if (!deliveryPartnerId) {
      return res.status(400).json({ success: false, message: "Delivery Partner ID is required." });
    }

    const payouts = await PayoutTransaction.find({ deliveryPartnerId }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      data: payouts.map(payout => ({
        monthName: payout.monthName,
        date: payout.date,
        amount: payout.amount
      }))
    });

  } catch (error) {
    console.error("Error fetching payouts:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};