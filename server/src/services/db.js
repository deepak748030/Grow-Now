import mongoose from "mongoose";
import { DB_URI } from "./config.js";

const connectDB = async () => {
    try {
        // console.log("🔥 MongoDB connecting....");
        await mongoose.connect(DB_URI);
        console.log("🔥 MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;
