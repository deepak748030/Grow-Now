import Vendor from "../models/Vendor.js";

// ✅ Create a vendor
export const createVendor = async (req, res) => {
    try {
        const { name, username, password, brandName } = req.body;

        if (!name || !username || !password || !brandName) {
            return res.status(400).json({
                success: false,
                error: "All fields are required: name, username, password, brandName",
            });
        }

        const exists = await Vendor.findOne({ username });
        if (exists) {
            return res.status(400).json({ success: false, error: "Username already exists" });
        }

        const newVendor = await Vendor.create({ name, username, password, brandName });
        res.status(201).json({ success: true, message: "Vendor created", data: newVendor });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

// ✅ Get all vendors
export const getVendors = async (req, res) => {
    try {
        const list = await Vendor.find().lean();
        res.json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch vendors" });
    }
};

// ✅ Get vendor by ID
export const getVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).lean();
        if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });

        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(400).json({ success: false, error: "Invalid Vendor ID" });
    }
};

// ✅ Update vendor
export const updateVendor = async (req, res) => {
    try {
        const { name, username, password, brandName } = req.body;
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });

        if (username && username !== vendor.username) {
            const exists = await Vendor.findOne({ username, _id: { $ne: req.params.id } });
            if (exists) {
                return res.status(400).json({ success: false, error: "Username already exists" });
            }
        }

        vendor.name = name || vendor.name;
        vendor.username = username || vendor.username;
        vendor.password = password || vendor.password;
        vendor.brandName = brandName || vendor.brandName;

        const updated = await vendor.save();
        res.json({ success: true, message: "Vendor updated", data: updated });
    } catch (error) {
        res.status(400).json({ success: false, error: "Update failed" });
    }
};

// ✅ Delete vendor
export const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });

        res.json({ success: true, message: "Vendor deleted" });
    } catch (error) {
        res.status(400).json({ success: false, error: "Delete failed" });
    }
};
