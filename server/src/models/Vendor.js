import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Vendor name is required"],
            trim: true,
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        brandName: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model("Vendor", VendorSchema);
