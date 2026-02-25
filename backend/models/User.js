import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    jobType: { type: String, default: "remoto" },
    seniority: { type: String, default: "ssr" },
    areas: { type: [String], default: ["Software Development"] },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
