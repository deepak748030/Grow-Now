import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const NUM_WORKERS = process.env.NUM_WORKERS || "auto"; // Auto-detects available CPUs
export const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/mydatabase";
export const SERVER_IMAGE_URL = process.env.SERVER_IMAGE_URL || "https://falbites-1.onrender.com";