// Subscription Controllers
import Subscription from '../models/Subscription.js';
import { SERVER_IMAGE_URL } from '../services/config.js';
// import redis from '../redis/redisClient.js'

// Create Subscription
export const createSubscription = async (req, res) => {
    try {
        const { title, description, category, weightOrCount, tag, types, mainImageIndex, franchiseIds } = req.body;
        console.log(req.body)
        if (!title || !description || !category || !weightOrCount || !types || !req.files || mainImageIndex === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const images = req.files.map((file) => {
            if (!file || !file.filename) {
                throw new Error('Invalid file upload');
            }
            return `${SERVER_IMAGE_URL}/uploads/${file.filename}`;
        });

        if (mainImageIndex < 0 || mainImageIndex >= images.length) {
            return res.status(400).json({ error: 'Invalid mainImageIndex' });
        }

        const mainImage = images[mainImageIndex];

        // Ensure the main image is at index 0
        images.splice(mainImageIndex, 1);
        images.unshift(mainImage);

        const newSubscription = new Subscription({
            title,
            description,
            category,
            weightOrCount,
            tag,
            imageUrl: images, // All images including the main image
            types: JSON.parse(types),
            franchiseIds: Array.isArray(franchiseIds) ? franchiseIds : JSON.parse(franchiseIds)
        });

        const savedSubscription = await newSubscription.save();
        // await redis.del("subscriptions"); // Clear cache after creating a new subscription
        res.status(201).json({
            success: true,
            data: [savedSubscription] // Returning as array to match frontend expectation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all Subscriptions
export const getAllSubscriptions = async (req, res) => {
    try {
        // const subscriptionCache = await redis.get("subscriptions");
        if (subscriptionCache) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(subscriptionCache)
            });
        }
        const subscriptions = await Subscription.find();
        // await redis.set("subscriptions", JSON.stringify(subscriptions), "EX", 3600); // Cache for 1 hour
        res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get Subscription by ID
export const getSubscriptionById = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }
        res.status(200).json(subscription);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update Subscription using PATCH
export const updateSubscription = async (req, res) => {
    try {
        const { title, description, category, weightOrCount, tag, types, mainImageIndex, franchiseIds } = req.body;
        const updateData = { title, description, category, weightOrCount, tag };

        if (franchiseIds) {
            updateData.franchiseIds = Array.isArray(franchiseIds) ? franchiseIds : JSON.parse(franchiseIds);
        }

        if (req.files && req.files.length > 0) {
            const images = req.files.map((file) => {
                if (!file || !file.filename) {
                    throw new Error('Invalid file upload');
                }
                return `${SERVER_IMAGE_URL}/uploads/${file.filename}`;
            });

            if (mainImageIndex === undefined || mainImageIndex < 0 || mainImageIndex >= images.length) {
                return res.status(400).json({ error: 'Invalid mainImageIndex' });
            }

            const mainImage = images[mainImageIndex];

            // Ensure the main image is at index 0
            images.splice(mainImageIndex, 1);
            images.unshift(mainImage);

            updateData.imageUrl = images; // Update all images including the main image
        }

        if (types) {
            updateData.types = JSON.parse(types);
        }

        const updatedSubscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedSubscription) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }
        // await redis.del("subscriptions"); // Clear cache after updating a subscription
        res.status(200).json({
            success: true,
            data: [updatedSubscription] // Returning as array to match frontend expectation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete Subscription
export const deleteSubscription = async (req, res) => {
    try {
        const deletedSubscription = await Subscription.findByIdAndDelete(req.params.id);
        if (!deletedSubscription) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }
        // await redis.del("subscriptions"); // Clear cache after creating a new subscription
        res.status(200).json({
            success: true,
            message: 'Subscription deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Search Subscriptions
export const searchSubscriptions = async (req, res) => {
    try {
        const { q, category } = req.query;
        let query = {};

        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        const subscriptions = await Subscription.find(query);
        res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};