import Setting from "../models/Setting.js";
import { SERVER_IMAGE_URL } from "../services/config.js";
import redis from '../redis/redisClient.js'


// GET settings
export const getSettings = async (_, res) => {
    try {
        const cacheKey = 'settings';
        const cachedSettings = await redis.get(cacheKey);

        if (cachedSettings) {
            return res.status(200).json({ success: true, data: JSON.parse(cachedSettings) });
        }

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await new Setting().save();
        }

        // Cache the settings in Redis
        await redis.set(cacheKey, JSON.stringify(settings));

        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH/UPDATE settings
export const updateSettings = async (req, res) => {
    try {
        const {
            maintenance,
            links,
            rechargeOptions,
            minAddMoney,
            maxRefers,
            referReward,
            deliveryTiming,
            maxSubscriptionUpdateOrCancelTime,
            platformFees
        } = req.body;

        const updateData = {};

        // ✅ Conditional text/number fields
        if (maintenance !== undefined) updateData.maintenance = maintenance === 'true' || maintenance === true;
        if (minAddMoney !== undefined) updateData.minAddMoney = Number(minAddMoney);
        if (maxRefers !== undefined) updateData.maxRefers = Number(maxRefers);
        if (referReward !== undefined) updateData.referReward = Number(referReward);
        if (deliveryTiming !== undefined) updateData.deliveryTiming = deliveryTiming;
        if (maxSubscriptionUpdateOrCancelTime !== undefined) updateData.maxSubscriptionUpdateOrCancelTime = maxSubscriptionUpdateOrCancelTime;
        if (platformFees !== undefined) updateData.platformFees = Number(platformFees);

        // ✅ Smart parse for links - merge with existing links
        if (links) {
            const existingSettings = await Setting.findOne();
            const parsedLinks = typeof links === 'string' ? JSON.parse(links) : links;
            updateData.links = {
                ...existingSettings?.links || {},
                ...parsedLinks
            };
        }

        // ✅ Smart parse for rechargeOptions
        if (rechargeOptions) updateData.rechargeOptions = typeof rechargeOptions === 'string' ? JSON.parse(rechargeOptions) : rechargeOptions;

        // ✅ Handle each image independently (optional and updatable separately)
        if (req.files?.bottomImage?.[0]) {
            updateData.bottomImage = `${SERVER_IMAGE_URL}/uploads/${req.files.bottomImage[0].filename}`;
        }

        if (req.files?.referImage?.[0]) {
            updateData.referImage = `${SERVER_IMAGE_URL}/uploads/${req.files.referImage[0].filename}`;
        }

        if (req.files?.healthyBanner?.[0]) {
            updateData.healthyBanner = `${SERVER_IMAGE_URL}/uploads/${req.files.healthyBanner[0].filename}`;
        }

        if (req.files?.searchBackgroundImage?.[0]) {
            updateData.searchBackgroundImage = `${SERVER_IMAGE_URL}/uploads/${req.files.searchBackgroundImage[0].filename}`;
        }

        if (req.files?.topBannerImage?.[0]) {
            updateData.topBannerImage = `${SERVER_IMAGE_URL}/uploads/${req.files.topBannerImage[0].filename}`;
        }

        if (req.files?.referPageImageAttachment?.[0]) {
            updateData.referPageImageAttachment = `${SERVER_IMAGE_URL}/uploads/${req.files.referPageImageAttachment[0].filename}`;
        }

        // ✅ Patch update (merge if exists, create if not)
        const updated = await Setting.findOneAndUpdate(
            {},
            { $set: updateData },
            { new: true, upsert: true }
        );
        await redis.del('settings'); // Invalidate the cache
        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
        console.log(err);
    }
};
