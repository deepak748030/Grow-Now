import BoxReview from "../models/BoxReviews.js";
import User from "../models/User.js";

export const getAllBoxReviews = async (req, res) => {
    try {
        const reviews = await BoxReview.find()
            .populate({
                path: 'orderId',
                select: '-orders', // Exclude the 'orders' field
                populate: {
                    path: 'userID', // Nested populate for userID
                    model: User, // Reference the User model
                    select: 'mobileNumber name' // Select specific fields from User
                }
            })
            .populate({
                path: 'deliveryPartnerId',
                select: 'firstName lastName mobileNumber assignedBranchId',
                populate: {
                    path: 'assignedBranchId',
                    select: 'branchName cityName name location.locationName' // Add fields you want from branch
                }
            });

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: "No box reviews found" });
        }

        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching box reviews", error });
    }
};

export const deleteBoxReview = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReview = await BoxReview.findByIdAndDelete(id);

        if (!deletedReview) {
            return res.status(404).json({ message: "Box review not found" });
        }

        res.status(200).json({ message: "Box review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting box review", error });
    }
};