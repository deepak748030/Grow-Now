import DailyTips from '../models/DailyTips.js';
import fs from 'fs';
import path from 'path';
import { SERVER_IMAGE_URL } from '../services/config.js';
import redis from '../redis/redisClient.js'; // Optional: Redis client for caching

const deleteImage = (imageUrl) => {
    const filePath = path.join(process.cwd(), imageUrl);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// ✅ Create Daily Tip
export const createDailyTip = async (req, res) => {
    try {
        const { title, subscription } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });

        const imageUrl = req.file ? `${SERVER_IMAGE_URL}/uploads/${req.file.filename}` : '';

        const newTip = new DailyTips({ title, imageUrl, subscription });
        await newTip.save();
        await redis.del("dailyTipsCache");
        res.status(201).json({ success: true, data: newTip });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get All Daily Tips
export const getAllDailyTips = async (req, res) => {
    try {
        const cacheKey = 'dailyTipsCache';
        const cachedCategories = await redis.get(cacheKey);
        if (cachedCategories) {
            return res.status(200).json({ success: true, data: JSON.parse(cachedCategories) });
        }

        const tips = await DailyTips.find().select('-createdAt -updatedAt -__v').sort({ createdAt: -1 });
        await redis.set(cacheKey, JSON.stringify(tips), 'EX', 3600); // Cache for 1 hour

        res.status(200).json({ success: true, data: tips });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get Daily Tip by ID
export const getDailyTipById = async (req, res) => {
    try {
        const tip = await DailyTips.findById(req.params.id);
        if (!tip) return res.status(404).json({ error: 'Tip not found' });

        res.status(200).json({ success: true, data: tip });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Update Daily Tip using PATCH
export const updateDailyTip = async (req, res) => {
    try {
        const { title, subscription } = req.body;
        const updateData = { title, subscription };

        const tip = await DailyTips.findById(req.params.id);
        if (!tip) return res.status(404).json({ error: 'Tip not found' });

        if (req.file) {
            if (tip.imageUrl) deleteImage(tip.imageUrl);
            updateData.imageUrl = `${SERVER_IMAGE_URL}/uploads/${req.file.filename}`;
        }

        const updatedTip = await DailyTips.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        await redis.del("dailyTipsCache");

        res.status(200).json({ success: true, data: updatedTip });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Delete Daily Tip
export const deleteDailyTip = async (req, res) => {
    try {
        const tip = await DailyTips.findById(req.params.id);
        if (!tip) return res.status(404).json({ error: 'Tip not found' });

        if (tip.imageUrl) deleteImage(tip.imageUrl);

        await DailyTips.findByIdAndDelete(req.params.id);
        await redis.del("dailyTipsCache");
        res.status(200).json({ success: true, message: 'Daily Tip deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
