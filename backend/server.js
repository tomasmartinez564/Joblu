import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ==========================================
// ⚙️ CONFIGURACIÓN Y CONEXIÓN
// ==========================================
dotenv.config();

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import { authenticateToken } from "./middlewares/auth.js";
import { aiLimiter } from "./middlewares/rateLimit.js";
import { optimizeCvSection } from "./controllers/cvController.js";
import { getPublicProfile } from "./controllers/userController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();

// ==========================================
// 🔗 INICIALIZACIÓN DE BASE DE DATOS
// ==========================================
connectDB();

// ==========================================
// 🛠️ MIDDLEWARES
// ==========================================
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    console.warn(`[CORS] Intento de acceso desde origen no listado: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));

// Uploads státicos
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

app.set("trust proxy", 1);

// ==========================================
// 📡 RUTAS
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// El public profile usa "users" en la ruta original, lo mapeamos acá:
app.get("/api/users/profile/:email", authenticateToken, getPublicProfile);

app.use("/api/community", communityRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api/jobs", jobRoutes);

// Ruta IA aislada en /api/optimizar-cv
app.post("/api/optimizar-cv", authenticateToken, aiLimiter, optimizeCvSection);

// ==========================================
// 🚀 INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ Joblu Backend corriendo en puerto ${PORT}`);
});