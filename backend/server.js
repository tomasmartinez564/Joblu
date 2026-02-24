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
import bcrypt from "bcryptjs"; // Importante para manejar contraseñas seguras
import puppeteer from "puppeteer"; // Importación de Puppeteer
// ==========================================
// ⚙️ CONFIGURACIÓN Y VARIABLES DE ENTORNO
// ==========================================
dotenv.config();
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET no está configurado en .env. El servidor no puede arrancar de forma segura.");
  process.exit(1);
}
const MONGODB_URI = process.env.MONGODB_URI;

// Inicialización de aplicaciones y clientes
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==========================================
// 🔗 CONEXIÓN A BASE DE DATOS (MongoDB)
// ==========================================
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI no encontrada en .env. La base de datos no funcionará.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));
}

// ==========================================
// 📦 MODELOS DE DATOS
// ==========================================

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
  isEdited: { type: Boolean, default: false }
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

// ==========================================
// 🛠️ MIDDLEWARES Y UTILIDADES
// ==========================================
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));

// Configuración de archivos estáticos (uploads)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Configurar "trust proxy" en 1 para que Render confíe en los proxies
app.set("trust proxy", 1);

// Limitador para rutas de IA
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

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

// Configuración Multer para Importación de CVs
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

// ==========================================
// 📡 RUTAS DE LA API
// ==========================================

// ====================
// 🔐 Rutas de Autenticación
// ====================

// Registro de Usuario
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // Validar longitud de contraseña
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "Usuario creado con éxito" });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
});

// Inicio de Sesión (Login)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Comparar contraseña ingresada con la hasheada en la BD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Generar Token JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Enviar respuesta (quitando la contraseña por seguridad)
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      token,
      user: userObj
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// Configuración Multer para Avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)."));
    }
  }
});

// Ruta para subir Avatar
app.post("/api/user/upload-avatar", authenticateToken, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen." });
    }

    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // Actualizar usuario en BD
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({ avatarUrl: user.avatar });
  } catch (err) {
    console.error("Error subiendo avatar:", err);
    res.status(500).json({ error: "Error al procesar la imagen." });
  }
});

// Actualizar Perfil y Preferencias
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { name, jobType, seniority, areas } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (name !== undefined) user.name = name;
    if (jobType !== undefined) user.jobType = jobType;
    if (seniority !== undefined) user.seniority = seniority;
    if (areas !== undefined) user.areas = areas;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (err) {
    console.error("Error actualizando perfil:", err);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});


// --- Sección: Usuarios (Público) ---

app.get("/api/users/profile/:email", authenticateToken, async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      name: user.name,
      avatar: user.avatar,
      preferences: {
        jobType: user.jobType,
        seniority: user.seniority,
        areas: user.areas
      }
    });
  } catch (err) {
    console.error("Error obteniendo perfil de usuario:", err);
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
});


// --- Sección: Comunidad ---

app.get("/api/community/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los posts" });
  }
});

app.get("/api/community/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: "Post no encontrado" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el post details" });
  }
});

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

app.put("/api/community/posts/:id", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "El contenido no puede estar vacío" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    if (post.authorEmail !== req.user.email) {
      return res.status(403).json({ error: "No tienes permiso para editar este post" });
    }

    post.content = content.trim();
    post.isEdited = true;
    await post.save();

    res.json(post);
  } catch (err) {
    console.error("Error editando post:", err);
    res.status(500).json({ error: "Error al editar el post" });
  }
});

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

// Eliminar un comentario propio
app.delete("/api/community/posts/:id/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comentario no encontrado" });

    if (comment.authorEmail !== req.user.email) {
      return res.status(403).json({ error: "No tenés permiso para borrar este comentario" });
    }

    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Error eliminando comentario:", err);
    res.status(500).json({ error: "Error al eliminar el comentario" });
  }
});

app.post("/api/community/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post no encontrado" });

    const { action } = req.body || {};
    // Normalizamos ids con String() por seguridad ante nulls u ObjectIds
    const userIdStr = String(req.user.id);
    const index = post.likedBy.findIndex(id => String(id) === userIdStr);
    const alreadyLiked = index !== -1;

    console.log(`[Like API] Post: ${post._id}, User: ${userIdStr}, Action received: ${action}, Already liked: ${alreadyLiked}`);

    if (action === "like") {
      if (!alreadyLiked) post.likedBy.push(req.user.id);
    } else if (action === "unlike") {
      if (alreadyLiked) post.likedBy.splice(index, 1);
    } else {
      // Toggle automático (compatibilidad)
      if (alreadyLiked) post.likedBy.splice(index, 1);
      else post.likedBy.push(req.user.id);
    }

    await post.save();

    // Recalcular índice para JSON de respuesta
    const newIndex = post.likedBy.findIndex(id => String(id) === userIdStr);

    console.log(`[Like API] Success, LikedBy length: ${post.likedBy.length}`);

    res.json({
      postId: post._id,
      likes: post.likedBy.length,
      userHasLiked: newIndex !== -1,
      likedBy: post.likedBy
    });
  } catch (err) {
    console.error(`[Like API] Error en post ${req.params.id}:`, err);
    res.status(500).json({ error: "Error al actualizar like" });
  }
});

// --- Sección: Currículums (CVs) ---

app.get("/api/cvs", authenticateToken, async (req, res) => {
  try {
    const cvs = await Cv.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(cvs);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener CVs" });
  }
});

app.get("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const cv = await Cv.findOne({ _id: req.params.id, userId: req.user.id });
    if (!cv) return res.status(404).json({ error: "CV no encontrado" });
    res.json(cv);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el CV" });
  }
});

app.post("/api/cvs", authenticateToken, async (req, res) => {
  try {
    const newCv = new Cv({ userId: req.user.id, ...req.body });
    await newCv.save();
    res.status(201).json(newCv);
  } catch (err) {
    res.status(500).json({ error: "Error al crear CV" });
  }
});

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

app.delete("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const deletedCv = await Cv.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedCv) return res.status(404).json({ error: "CV no encontrado" });
    res.json({ message: "CV eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar CV" });
  }
});

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

    let parsedData = { nombre: "", puesto: "", email: "", telefono: "", ubicacion: "", sitioWeb: "", linkedin: "", github: "", perfil: "", experience: [], educacion: "", skills: [], languages: [], proyectos: "", otros: "" };

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `Eres un experto en reclutamiento. Extrae la información del CV y devuélvela ESTRICTAMENTE en este formato JSON: { "nombre": "Nombre", "puesto": "Rol", "email": "correo@ej.com", "telefono": "Tel", "ubicacion": "Ciudad", "sitioWeb": "URL", "linkedin": "URL", "github": "URL", "perfil": "Resumen", "experience": [ { "id": "Genera un ID único como un timestamp en string", "position": "Puesto", "company": "Empresa", "location": "Ubicación", "startDate": "YYYY-MM", "endDate": "YYYY-MM o vacío", "current": true o false, "description": "Tareas y logros" } ], "educacion": "Texto plano", "skills": ["Hab 1", "Hab 2"], "languages": ["Id 1", "Id 2"], "proyectos": "Texto", "otros": "Texto" } ATENCIÓN: Separa cada trabajo distinto en un objeto dentro del array "experience". Extrae cada habilidad y cada idioma como elementos individuales de un array de strings ("skills" y "languages"). Si ves URLs pegadas por error, SEPÁRALAS lógicamente. Devuelve solo JSON.` },
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

    const newCv = new Cv({
      userId: req.user.id,
      title: req.file.originalname,
      puesto: parsedData.puesto || "",
      data: parsedData
    });

    await newCv.save();
    try { fs.unlinkSync(req.file.path); } catch (e) { }

    res.status(201).json(newCv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al importar el CV." });
  }
});

// --- Sección: Inteligencia Artificial (Optimización) ---

app.post("/api/optimizar-cv", authenticateToken, aiLimiter, async (req, res) => {
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

    userPrompt += "\n\nDevuelve ÚNICAMENTE el texto mejorado. No incluyas títulos, etiquetas, ni el nombre de la sección. No uses markdown (negritas, comillas) salvo que sea parte del contenido del CV.";

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

// --- Sección: Empleos (Jobs) ---

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

let pdfBrowser = null;
let isGeneratingPdf = false;

async function getPdfBrowser() {
  if (pdfBrowser && pdfBrowser.isConnected()) return pdfBrowser;

  console.log("[PDF] Launching shared browser...");
  pdfBrowser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--no-zygote",
      "--disable-gpu"
    ]
  });

  pdfBrowser.on("disconnected", () => {
    console.log("[PDF] Browser disconnected. Resetting instance.");
    pdfBrowser = null;
  });

  return pdfBrowser;
}

function logMemory(label) {
  const m = process.memoryUsage();
  console.log(`[MEM] ${label}`, {
    rss: `${Math.round(m.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(m.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(m.heapTotal / 1024 / 1024)} MB`
  });
}

app.post("/api/cvs/generate-pdf", authenticateToken, async (req, res) => {
  let page = null;

  // Evita 2 generaciones al mismo tiempo (muy útil en Render Free/Standard)
  if (isGeneratingPdf) {
    return res.status(429).json({
      error: "Ya se está generando un PDF. Intentá nuevamente en unos segundos."
    });
  }

  try {
    isGeneratingPdf = true;

    const { htmlContent, styleTags } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: "htmlContent es requerido" });
    }

    logMemory("Antes de generar PDF");

    const browser = await getPdfBrowser();
    console.log("[PDF] Opening new page...");
    page = await browser.newPage();

    // Reducir consumo: bloquear recursos externos pesados (opcional pero muy recomendado)
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Si tu HTML usa fuentes/imágenes remotas, esto evita cuelgues por networkidle
      if (["media"].includes(resourceType)) {
        return request.abort();
      }

      // Podés bloquear imágenes externas si NO son necesarias en el CV:
      // if (resourceType === "image" && url.startsWith("http")) return request.abort();

      request.continue();
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          ${styleTags || ""}
          <style>
            @page { margin: 0; size: A4; }
            html, body {
              margin: 0;
              padding: 0;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cv-preview-paper {
              box-shadow: none !important;
              margin: 0 !important;
              width: 100% !important;
              min-height: 297mm;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `;

    console.log("[PDF] Setting content...");
    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded", // <- antes tenías networkidle0 (problemático)
      timeout: 60000 // 60s
    });

    // pequeña pausa para layout/fonts locales (opcional)
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log("[PDF] Generating PDF buffer...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });

    console.log("[PDF] Success. Sending response.");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length
    });
    res.send(pdfBuffer);

    logMemory("Después de generar PDF");
  } catch (error) {
    console.error("[PDF] Error generando PDF con Puppeteer:", error);
    res.status(500).json({
      error: "Error al generar el PDF",
      details: error.message
    });
  } finally {
    // Cerrar la page SIEMPRE, aunque falle
    if (page) {
      try {
        await page.close();
        console.log("[PDF] Page closed.");
      } catch (e) {
        console.warn("[PDF] Error closing page:", e.message);
      }
    }

    isGeneratingPdf = false;
  }
});

// ==========================================
// 🚀 INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ Joblu Backend corriendo en puerto ${PORT}`);
});