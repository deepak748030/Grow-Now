import Worker from "../models/worker.js";

export const createWorker = async (req, res) => {
  try {
    const { type, franchiseId } = req.body;
    if (type === "truck-driver") {
      const existingTruckDriver = await Worker.findOne({
        franchiseId,
        type: "truck-driver"
      });

      if (existingTruckDriver) {
        return res.status(400).json({
          success: false,
          message: "Only one truck driver is allowed per franchise."
        });
      }
    }
    const worker = await Worker.create(req.body);

    res.json({ success: true, worker });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const updateWorkerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const worker = await Worker.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json({ success: true, worker });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getWorkersByFranchise = async (req, res) => {
  try {
    const { franchiseId } = req.params;
    const workers = await Worker.find({ franchiseId });
    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
