import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    type: { type: String },
    description: { type: String },
    url: { type: String },
    salary: { type: String },
    externalId: { type: String },
    tags: [String],
    logo: { type: String },
    publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export default Job;
