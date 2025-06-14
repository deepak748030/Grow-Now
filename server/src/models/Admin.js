import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{10}$/, // Ensures a 10-digit phone number
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Ensures a minimum password length
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Validates email format
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

const Admin = mongoose.model('Admin', AdminSchema);

export default Admin;