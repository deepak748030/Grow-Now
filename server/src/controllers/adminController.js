import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js'; // Assuming you have an Admin model

const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your actual secret key

// Controller for admin login with phone number and plain password
export const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ phone });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Validate password (plain text comparison)
        if (password !== admin.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Controller for admin registration
export const register = async (req, res) => {
    try {
        const { name, phone, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ phone });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create a new admin
        const newAdmin = new Admin({ name, phone, password });
        await newAdmin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
