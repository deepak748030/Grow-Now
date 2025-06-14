import Goal from '../models/Goal.js';
import fs from 'fs';
import path from 'path';
import { SERVER_IMAGE_URL } from '../services/config.js';

// ✅ Create Goal
export const createGoal = async (req, res) => {
    try {
        const { title, category } = req.body;

        if (!title || !category) {
            return res.status(400).json({ error: 'Title and category are required' });
        }

        const imageUrl = req.file ? `${SERVER_IMAGE_URL}/uploads/${req.file.filename}` : '';
        const newGoal = new Goal({ title, category, imageUrl });

        await newGoal.save();
        res.status(201).json({ success: true, data: newGoal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get All Goals
export const getAllGoals = async (req, res) => {
    try {
        const goals = await Goal.find().select('-createdAt -updatedAt -__v').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: goals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get Goal by ID
export const getGoalById = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ error: 'Goal not found' });

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Update Goal and Replace Image
export const updateGoal = async (req, res) => {
    try {
        const { title, category } = req.body;
        const updateData = { title, category };

        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ error: 'Goal not found' });

        if (req.file) {
            // Delete old image
            if (goal.imageUrl) {
                const oldImagePath = path.join('public', goal.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = `${SERVER_IMAGE_URL}/uploads/${req.file.filename}`;
        }

        const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        res.status(200).json({ success: true, data: updatedGoal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Delete Goal and Remove Image
export const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ error: 'Goal not found' });

        // Delete associated image
        if (goal.imageUrl) {
            const imagePath = path.join('public', goal.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Goal.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
