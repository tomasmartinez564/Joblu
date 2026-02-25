import mongoose from "mongoose";

const cvSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Mi CV" },
    puesto: { type: String },
    data: { type: Object },
}, { timestamps: true });

const Cv = mongoose.models.Cv || mongoose.model("Cv", cvSchema);
export default Cv;
