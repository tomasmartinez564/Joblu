import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import rateLimit from "express-rate-limit";

// ====================
// ⚙️ Configuración del Entorno
// ====================
dotenv.config();
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro_cambiar_en_env";
const MONGODB_URI = process.env.MONGODB_URI;

// Inicializar Apps y Clientes
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ====================
// 🛠️ Middleware
// ====================
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Servir archivos estáticos (uploads)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Middleware de Autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Acceso denegado. Token no provisto." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido o expirado." });
    req.user = user;
    next();
  });
};

// ====================
// 🔗 Base de Datos (MongoDB)
// ====================
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI no encontrada en .env. La base de datos no funcionará.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));
}

// ====================
// 📦 Modelos
// ====================

// 1. Usuario
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// 2. Currículum (CV)
const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Mi CV" },
  puesto: { type: String },
  data: { type: Object },
}, { timestamps: true });

const Cv = mongoose.models.Cv || mongoose.model("Cv", cvSchema);

// 3. Comunidad (Posts y Comentarios)
const commentSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const postSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: "General" },
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

// 4. Empleos
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

// ====================
// 📡 Rutas API
// ====================

// --- Comunidad ---

// Obtener todos los posts
app.get("/api/community/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los posts" });
  }
});

// Obtener un post por ID
app.get("/api/community/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: "Post no encontrado" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el post details" });
  }
});

// Crear un Post
app.post("/api/community/posts", authenticateToken, async (req, res) => {
  try {
    const { title, content, authorName, authorEmail, category } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Título y contenido requeridos" });

    const newPost = new Post({
      title,
      content,
      category: category || "General",
      authorName: authorName || req.user.name,
      authorEmail: authorEmail || req.user.email,
      likedBy: [],
      comments: []
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creando post:", err);
    res.status(500).json({ error: "Error al crear el post" });
  }
});

// Eliminar Post
app.delete("/api/community/posts/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    if (post.authorEmail !== req.user.email) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este post" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el post" });
  }
});

// Agregar Comentario
app.post("/api/community/posts/:id/comments", authenticateToken, async (req, res) => {
  try {
    const { content, authorName } = req.body;
    if (!content) return res.status(400).json({ error: "Contenido requerido" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    const newComment = {
      content,
      authorName: authorName || req.user.name,
      authorEmail: req.user.email,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error("Error comentando:", err);
    res.status(500).json({ error: "Error al agregar comentario" });
  }
});

// Dar/Quitar Like
app.post("/api/community/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    const index = post.likedBy.indexOf(req.user.id);
    if (index === -1) post.likedBy.push(req.user.id);
    else post.likedBy.splice(index, 1);

    await post.save();
    res.json({ likes: post.likedBy.length, userHasLiked: index === -1 });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar like" });
  }
});

// --- CVs ---

// Obtener mis CVs
app.get("/api/cvs", authenticateToken, async (req, res) => {
  try {
    const cvs = await Cv.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(cvs);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener CVs" });
  }
});

// Obtener un CV por ID
app.get("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const cv = await Cv.findOne({ _id: req.params.id, userId: req.user.id });
    if (!cv) return res.status(404).json({ error: "CV no encontrado" });
    res.json(cv);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el CV" });
  }
});

// Crear CV vacío/manual
app.post("/api/cvs", authenticateToken, async (req, res) => {
  try {
    const newCv = new Cv({ userId: req.user.id, ...req.body });
    await newCv.save();
    res.status(201).json(newCv);
  } catch (err) {
    res.status(500).json({ error: "Error al crear CV" });
  }
});

// Actualizar CV
app.put("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const updatedCv = await Cv.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedCv) return res.status(404).json({ error: "CV no encontrado" });
    res.json(updatedCv);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar CV" });
  }
});

// Eliminar CV
app.delete("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const deletedCv = await Cv.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedCv) return res.status(404).json({ error: "CV no encontrado" });
    res.json({ message: "CV eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar CV" });
  }
});

// Configuración Multer para Importación
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `cv-import-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadCv = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/plain"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF o de texto (.txt)."));
    }
  }
});

// Importar CV (PDF/TXT)
app.post("/api/cvs/import", authenticateToken, uploadCv.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No hay archivo para importar." });

    let extractedText = "";

    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (req.file.mimetype === "text/plain") {
      extractedText = fs.readFileSync(req.file.path, "utf8");
    }

    // Estructura por defecto
    let parsedData = {
      perfil: extractedText,
      experiencias: "", educacion: "", habilidades: "", idiomas: "", proyectos: "", otros: "",
      nombre: "", puesto: "", email: "", telefono: "", ubicacion: "", sitioWeb: "", linkedin: "", github: "",
    };

    // Procesar con OpenAI si hay API Key
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Eres un experto en reclutamiento. Extrae información de CVs a JSON estricto:
              {
                "nombre": "", "puesto": "", "email": "", "telefono": "", "ubicacion": "",
                "sitioWeb": "", "linkedin": "", "github": "", "perfil": "",
                "experiencias": "", "educacion": "", "habilidades": "", "idiomas": "", "proyectos": "", "otros": ""
              }
              Devuelve solo JSON.`
            },
            {
              role: "user",
              content: `Analiza este CV:\n\n${extractedText.substring(0, 15000)}`
            }
          ],
          response_format: { type: "json_object" }
        });

        parsedData = JSON.parse(completion.choices[0].message.content);
      } catch (aiError) {
        console.error("⚠️ Error parseando CV con IA (usando fallback):", aiError);
      }
    }

    // Crear y guardar el CV
    const newCv = new Cv({
      userId: req.user.id,
      title: req.file.originalname,
      puesto: parsedData.puesto || "",
      data: parsedData
    });

    await newCv.save();

    // Limpieza
    try { fs.unlinkSync(req.file.path); } catch (e) { }

    res.status(201).json(newCv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al importar el CV." });
  }
});

// --- IA (Optimización) ---
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // Aumentado un poco el límite

app.post("/api/optimizar-cv", aiLimiter, async (req, res) => {
  const { section, content, language, tone, goal, jobDescription } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ suggestion: `[Simulado] Versión mejorada (${tone}/${goal}) de: ${content}` });
  }

  try {
    const systemPrompt = `Eres un experto en RRHH. Mejora el texto para un CV.
    Idioma: ${language === 'en' ? 'Inglés' : 'Español'}.
    Tono: ${tone || 'Profesional'}.`;

    let userPrompt = `Texto original (${section}): "${content}".`;
    if (jobDescription) userPrompt += `\n\nContexto puesto: "${jobDescription}".`;

    if (goal === 'fix') userPrompt += "\nObjetivo: Corregir gramática.";
    else if (goal === 'make_shorter') userPrompt += "\nObjetivo: Resumir.";
    else if (goal === 'keywords') userPrompt += "\nObjetivo: Agregar palabras clave.";
    else userPrompt += "\nObjetivo: Mejorar impacto y profesionalismo.";

    userPrompt += "\n\nSolo devuelve el texto mejorado.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    });
    res.json({ suggestion: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error("Error OpenAI:", err);
    res.status(500).json({ error: "Error al procesar con IA." });
  }
});

// --- Empleos ---
app.get("/api/jobs", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ error: "Error al obtener empleos", details: err.message });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Empleo no encontrado" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el empleo" });
  }
});

// ====================
// 🚀 Iniciar Servidor
// ====================
app.listen(PORT, () => {
  console.log(`✅ Joblu Backend corriendo en puerto ${PORT}`);
});