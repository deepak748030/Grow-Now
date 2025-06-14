import UnavailableLocation from "../models/UnavailableLocation.js";

// Add new location
export const addUnavailableLocation = async (req, res) => {
  try {
    const location = new UnavailableLocation(req.body);
    await location.save();
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding location", error: error.message });
  }
};

// Get all locations
export const getAllUnavailableLocations = async (_, res) => {
  try {
    const locations = await UnavailableLocation.find()
      .populate({ path: 'addedBy', select: 'mobileNumber name' })
      .sort({ date: -1 });
    res.status(200).json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching locations", error: error.message });
  }
};

// Get location by ID
export const getUnavailableLocationById = async (req, res) => {
  try {
    const location = await UnavailableLocation.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: "Location not found" });
    res.status(200).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching location", error: error.message });
  }
};

// Update location by ID
export const updateUnavailableLocation = async (req, res) => {
  try {
    const location = await UnavailableLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ success: false, message: "Location not found" });
    res.status(200).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating location", error: error.message });
  }
};

// Delete location
export const deleteUnavailableLocation = async (req, res) => {
  try {
    const location = await UnavailableLocation.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: "Location not found" });
    res.status(200).json({ success: true, message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting location", error: error.message });
  }
};
