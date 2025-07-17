import express from "express";
import compression from "compression"; // ✅ Compress responses
import helmet from "helmet"; // ✅ Secure HTTP headers
import cors from "cors"; // ✅ Enable CORS
import morgan from "morgan"; // ✅ Logger
import http from "http";
import { Server } from "socket.io";

import "../jobs/otpCron.js"; // OTP Cron Job
import "../jobs/attendanceJob.js"; // Attendance Cron Job
import "../jobs/subscriptionPaymentOrderCheck.js"; // Subscription Payment Order Check Cron Job

import userRoutes from "../routes/userRoutes.js";
import categoryRoutes from "../routes/categoryRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";
import subscriptionRoutes from "../routes/subscriptionRoutes.js";
import transactionRoutes from "../routes/transactionRoutes.js";
import settingRoutes from "../routes/settingRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import deliveryPreferences from "../routes/deliveryPreferencesRoutes.js";
import subscriptionOrdersRoutes from "../routes/subscriptionOrdersRoutes.js";
import supportTicketsRoutes from "../routes/supportTicketsRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import DailyTips from "../routes/DailyTipsRoutes.js"; // ✅ Daily Tips Routes
import goalRoutes from "../routes/goalRoutes.js"; // ✅ Goal Routes
import homeRoutes from "../routes/homesRoutes.js";
import connectDB from "../services/db.js";
import errorHandler from "../middleware/errorHandler.js";
import productOrdersRoutes from "../routes/productOrdersRoutes.js";
import categoryChoice from "../routes/categoryByChoiceRoutes.js";
import referralRoutes from "../routes/referralRoute.js";
import franchiseRouter from "../routes/FranchiseRouter.js"; // ✅ Franchise Routes
import deliverPartnerRoutes from "../routes/deliverPartnerRoutes.js"; // Delivery Partner Routes
import PayoutRouter from "../routes/PayoutRouter.js"; // Payout Routes
import dashboard from "../routes/dashboardRouter.js"; // Dashboard Routes
import AdminRoutes from "../routes/adminRoutes.js"; // Payout Routes
import ReviewRoute from "../routes/reviewRoutes.js"; // Review Routes
import unavailableLocationRoutes from "../routes/unavailableLocation.js"; // Unavailable Routes
import workersRoute from "../routes/workerRoutes.js"; // Worker Route
import "../redis/redisClient.js"
import AttendanceRouter from "../routes/AttandanceRouter.js"; // Attendance Routes
import BoxRoutes from '../routes/boxRoutes.js'
import topCategoryRoutes from "../routes/topCategoryRoutes.js";
import subCategoryRoutes from "../routes/subCategoryRoutes.js";
import vendorRoutes from "../routes/vendorRoutes.js";
import bulkDeliveryRoutes from '../routes/bulkDeliveryRoutes.js';
import brandRoutes from '../routes/brandRoutes.js'

import upload from "../middleware/multer.js";

// Connect to MongoDB
connectDB();

const app = express();

// ✅ Security & Optimization Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cors({ origin: "*" })); // Adjust origin for security
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(morgan("dev")); // Logger

app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: function (res, path) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

// ✅ Routes
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/transaction", transactionRoutes);
app.use("/settings", settingRoutes);
app.use("/notification", notificationRoutes);
app.use("/delivery-preferences", deliveryPreferences);
app.use("/subscription-order", subscriptionOrdersRoutes);
app.use("/product-order", productOrdersRoutes);
app.use("/subscription-order-1", supportTicketsRoutes);
app.use("/products", productRoutes);
app.use("/daily-tips", DailyTips);
app.use("/goals", goalRoutes);
app.use("/home", homeRoutes);
app.use("/category-choices", categoryChoice);
app.use("/referrals", referralRoutes);
app.use("/franchises", franchiseRouter); // Franchise Routes
app.use("/category-choice", categoryChoice); // Category Choice Routes
app.use("/delivery-partner", deliverPartnerRoutes); // Delivery Partner Routes
app.use("/payout", PayoutRouter); // Payout Routes
app.use("/dashboard", dashboard); // Dashboard Routes
app.use("/admin", AdminRoutes); // Payout Routes
app.use("/review", ReviewRoute); // Review Routes
app.use("/unavailable-locations", unavailableLocationRoutes); // Unavailable Location Routes
app.use("/workers", workersRoute); // Worker Route
app.use("/attendance", AttendanceRouter); // Attendance Routes
app.use("/box", BoxRoutes); // Box Routes
app.use("/categories", categoryRoutes);
app.use("/top-categories", topCategoryRoutes);
app.use("/sub-categories", subCategoryRoutes);
app.use("/vendors", vendorRoutes);
app.use('/bulk-delivery', bulkDeliveryRoutes);
app.use('/brand', brandRoutes);


// ✅ Default Route
app.get("/", (req, res) => {
  res.send("✅ Server running successfully!");
});

// ✅ Image Upload Route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, fileUrl });
});

// ✅ Socket.io S etup (if needed)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Or restrict to frontend domain
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinFranchiseRoom", (franchiseId) => {
    socket.join(franchiseId);
    console.log(`Socket ${socket.id} joined room ${franchiseId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// ✅ Error Handling Middleware (Keep at the end)
app.use(errorHandler);

export default app;
