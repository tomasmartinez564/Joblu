import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.warn("⚠️ MONGODB_URI no encontrada en .env. La base de datos no funcionará.");
            return;
        }
        await mongoose.connect(uri);
        console.log("✅ Conectado a MongoDB Atlas");
    } catch (err) {
        console.error("❌ Error al conectar a MongoDB:", err);
        process.exit(1);
    }
};

export default connectDB;
