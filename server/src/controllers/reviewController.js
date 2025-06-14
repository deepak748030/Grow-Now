import Review from "../models/Review.js";

export const createReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create review" });
  }
};

export const getReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.deliveryPartnerId) filter.deliveryPartnerId = req.query.deliveryPartnerId;
    if (req.query.subscriptionId) filter.subscriptionId = req.query.subscriptionId;

    const reviews = await Review.find(filter)
      .populate({
        path: "deliveryPartnerId",
        select: "firstName lastName mobileNumber vehicleType city branch"
      })
      .populate({
        path: "subscriptionId",
        select: "title imageUrl"
      })
      .populate({
        path: "userId",
        select: "name mobileNumber"
      })
      .populate({
        path: "franchiseId",
        select: "location name cityName branchName assignedManager",
        populate: {
          path: "assignedManager",
          select: "name email mobileNumber"
        }
      })
      .sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};
