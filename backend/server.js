import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import rateLimit from "express-rate-limit";

// ====================
// ⚙️ Configuración Base
// ====================
dotenv.config();
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro_cambiar_en_env";

// 📂 Configuración de carpetas y archivos estáticos
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// 🛠 Middleware Global
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// 🛡️ Middleware de Autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token no provisto." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado." });
    }
    req.user = user;
    next();
  });
};

// ====================
// 🔗 Conexión a MongoDB
// ====================
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.warn("⚠️ No se encontró MONGODB_URI en el .env. La comunidad NO funcionará sin DB.");
} else {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));
}

// ====================
// 👤 Modelos de Datos
// ====================

// Usuario con soporte para Avatar
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Currículum (CV)
const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Mi CV" },
  puesto: { type: String },
  data: { type: Object },
}, { timestamps: true });

const Cv = mongoose.models.Cv || mongoose.model("Cv", cvSchema);

// Comunidad (Posts y Comentarios)
const commentSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const postSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  title: { type: String, required: true },
  content: { type: String, required: true },
  comments: [commentSchema],
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lkCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

postSchema.virtual('likes').get(function () {
  return this.likedBy ? this.likedBy.length : 0;
});

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

// Empleos (Jobs)
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  type: { type: String },
  description: { type: String },
  url: { type: String },
  salary: { type: String },
  tags: [String],
  logo: { type: String },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

// ====================
// 📁 Configuración Multer
// ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes."));
  }
});

// ====================
// 🔐 Endpoints Auth
// ====================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Faltan datos." });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "El email ya existe." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Usuario creado." });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Credenciales inválidas." });
    }

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

// ====================
// 👤 Endpoints Usuario
// ====================

app.post("/api/user/upload-avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No hay archivo." });
    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    res.status(500).json({ error: "Error subiendo avatar." });
  }
});

// ====================
// 🤝 Endpoints Comunidad
// ====================

app.get("/api/community/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  res.json(posts);
});

app.post("/api/community/posts/:id/like", authenticateToken, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "No encontrado." });

  const index = post.likedBy.indexOf(req.user.id);
  if (index === -1) post.likedBy.push(req.user.id);
  else post.likedBy.splice(index, 1);

  await post.save();
  res.json({ likes: post.likedBy.length, userHasLiked: index === -1 });
});

// ====================
// 📄 Endpoints CV
// ====================

app.get("/api/cvs", authenticateToken, async (req, res) => {
  const cvs = await Cv.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(cvs);
});

app.post("/api/cvs", authenticateToken, async (req, res) => {
  const newCv = new Cv({ userId: req.user.id, ...req.body });
  await newCv.save();
  res.status(201).json(newCv);
});

// ====================
// 🤖 IA CV (OpenAI)
// ====================
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

app.post("/api/optimizar-cv", aiLimiter, async (req, res) => {
  const { section, content, language, tone, jobDescription } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ suggestion: `[Simulado] Versión mejorada de: ${content}` });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Eres un experto en HR. Tono: ${tone || 'Profesional'}.` },
        { role: "user", content: `Optimiza esta sección de CV (${section}) en ${language || 'es'}: ${content}. Contexto puesto: ${jobDescription}` }
      ],
    });
    res.json({ suggestion: completion.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ error: "Error con la IA." });
  }
});

// ====================
// 💼 Endpoints Empleos
// ====================

app.get("/api/jobs", async (req, res) => {
  const { search } = req.query;
  let query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } }
    ];
  }
  const jobs = await Job.find(query).sort({ publishedAt: -1 }).limit(50);
  res.json(jobs);
});

// ====================
// 🚀 Lanzamiento
// ====================
app.listen(PORT, () => {
  console.log(`✅ Joblu Backend escuchando en puerto ${PORT}`);
});