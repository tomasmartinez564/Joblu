import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error("❌ MONGODB_URI no encontrada");
    process.exit(1);
}

const jobSchema = new mongoose.Schema({}, { strict: false });
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

async function check() {
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Conectado a MongoDB");
        const count = await Job.countDocuments();
        console.log(`📊 Total de empleos en DB: ${count}`);

        if (count > 0) {
            const sample = await Job.findOne();
            console.log("📝 Ejemplo:", JSON.stringify(sample, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

check();
