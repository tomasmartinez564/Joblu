import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Importar bcrypt
import jwt from "jsonwebtoken"; // Importar jwt

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de Autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token no provisto." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secreto_super_seguro_cambiar_en_env", (err, user) => {
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
    .then(() => {
      console.log("✅ Conectado a MongoDB");
    })
    .catch((err) => {
      console.error("❌ Error al conectar a MongoDB:", err);
    });
}


// ====================
// 👤 Modelo User (NUEVO)
// ====================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Podemos agregar rol: 'admin' | 'user' en el futuro
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// ====================
// 📄 Modelo Cv (NUEVO)
// ====================
const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Mi CV" },
  puesto: { type: String },
  data: { type: Object }, // Guardamos toda la estructura JSON del CV aquí
}, { timestamps: true });

const Cv = mongoose.models.Cv || mongoose.model("Cv", cvSchema);

// ====================
// 🧩 Modelo Post (Comunidad)
// ====================

// Comentarios dentro del post
const commentSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true },
    authorEmail: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // no necesitamos id propio para cada comentario
);

const postSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true },
    authorEmail: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    comments: [commentSchema],
    // likes: { type: Number, default: 0 }, // Deprecated concept, now calculated
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lkCount: { type: Number, default: 0 } // Cache para no hacer .length todo el tiempo
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual param for 'likes' for backward compatibility
postSchema.virtual('likes').get(function () {
  return this.likedBy ? this.likedBy.length : 0;
});

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);


// ====================
// 🤝 Endpoints Comunidad
// ====================

// GET /api/community/posts -> listar todos los posteos (más nuevos primero)
app.get("/api/community/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (err) {
    console.error("❌ Error al listar posts:", err);
    res.status(500).json({ error: "Error al obtener los posteos." });
  }
});

// GET /api/community/posts/:id -> obtener un post por ID
app.get("/api/community/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de post inválido." });
    }

    const post = await Post.findById(id).lean();

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado." });
    }

    res.json(post);
  } catch (err) {
    console.error("❌ Error al obtener post por id:", err);
    res.status(500).json({ error: "Error al obtener el post." });
  }
});

// POST /api/community/posts -> crear un nuevo post
app.post("/api/community/posts", async (req, res) => {
  try {
    const { authorName, authorEmail, title, content } = req.body || {};

    if (!title || !title.trim() || !content || !content.trim()) {
      return res
        .status(400)
        .json({ error: "Título y contenido son obligatorios." });
    }

    const post = new Post({
      authorName: authorName || "Usuario anónimo",
      authorEmail: authorEmail || "",
      title: title.trim(),
      content: content.trim(),
      comments: [],
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error("❌ Error al crear post:", err);
    res.status(500).json({ error: "Error al crear el posteo." });
  }
});

// POST /api/community/posts/:id/comments -> agregar un comentario
app.post("/api/community/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, authorEmail, content } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de post inválido." });
    }

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ error: "El comentario no puede estar vacío." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado." });
    }

    const comment = {
      authorName: authorName || "Usuario anónimo",
      authorEmail: authorEmail || "",
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // devolvemos solo el comentario recién agregado
    res.status(201).json(comment);
  } catch (err) {
    console.error("❌ Error al agregar comentario:", err);
    res.status(500).json({ error: "Error al agregar el comentario." });
  }
});

// POST /api/community/posts/:id/like -> Toggle like (requiere auth)
app.post("/api/community/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de post inválido." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post no encontrado." });
    }

    // Check if user already liked
    const alreadyLiked = post.likedBy.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter((uid) => uid.toString() !== userId);
    } else {
      // Like
      post.likedBy.push(userId);
    }

    // Save triggers virtuals and updates
    await post.save();

    // Devolvemos el post actualizado con el count correcto
    // Mongoose virtual 'likes' se incluirá si usamos toJSON endpoint
    res.json({
      _id: post._id,
      likes: post.likedBy.length,
      likedBy: post.likedBy,
      userHasLiked: !alreadyLiked
    });
  } catch (err) {
    console.error("❌ Error al actualizar likes:", err);
    res.status(500).json({ error: "Error al actualizar los likes." });
  }
});

// DELETE /api/community/posts/:id -> borrar post por id
app.delete("/api/community/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de post inválido." });
    }

    await Post.findByIdAndDelete(id);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al borrar post:", err);
    res.status(500).json({ error: "Error al borrar el posteo." });
  }
});


// ====================
// 📄 Endpoints CVs (NUEVO)
// ====================

// GET /api/cvs -> Listar CVs del usuario
app.get("/api/cvs", authenticateToken, async (req, res) => {
  try {
    const cvs = await Cv.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(cvs);
  } catch (err) {
    console.error("❌ Error al obtener CVs:", err);
    res.status(500).json({ error: "Error al obtener CVs." });
  }
});

// POST /api/cvs -> Crear CV
app.post("/api/cvs", authenticateToken, async (req, res) => {
  try {
    const { title, puesto, data } = req.body;
    const newCv = new Cv({
      userId: req.user.id,
      title: title || "Sin título",
      puesto: puesto || "",
      data: data || {}
    });
    await newCv.save();
    res.status(201).json(newCv);
  } catch (err) {
    console.error("❌ Error al guardar CV:", err);
    res.status(500).json({ error: "Error al guardar el CV." });
  }
});

// PUT /api/cvs/:id -> Actualizar CV
app.put("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, puesto, data } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    // Buscamos y actualizamos SOLO si pertenece al usuario
    const updatedCv = await Cv.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        $set: {
          title,
          puesto,
          data
        }
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!updatedCv) {
      return res.status(404).json({ error: "CV no encontrado o no autorizado." });
    }

    res.json(updatedCv);
  } catch (err) {
    console.error("❌ Error al actualizar CV:", err);
    res.status(500).json({ error: "Error al actualizar el CV." });
  }
});

// DELETE /api/cvs/:id -> Borrar CV
app.delete("/api/cvs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const deleted = await Cv.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({ error: "CV no encontrado o no autorizado." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al borrar CV:", err);
    res.status(500).json({ error: "Error al borrar el CV." });
  }
});


// ====================
// 💼 Modelo y Endpoints Empleos (Jobs)
// ====================

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    type: { type: String }, // "full_time", "contract", etc.
    description: { type: String }, // Viene con HTML
    url: { type: String }, // Link para aplicar
    salary: { type: String },
    externalId: { type: String },
    tags: [String], // Array de strings: ["React", "Design"]
    logo: { type: String },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

// GET /api/jobs -> Listar con búsqueda real
app.get("/api/jobs", async (req, res) => {
  try {
    const { search, tag, limit } = req.query;

    // Construimos el filtro dinámico
    let query = {};

    if (search) {
      // Busca texto en Título O Empresa O Tags
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }

    if (tag) {
      query.tags = { $in: [tag] }; // Filtra si tiene ese tag exacto
    }

    // Buscamos en BD
    const jobs = await Job.find(query)
      .sort({ publishedAt: -1 }) // Más nuevos primero
      .limit(limit ? parseInt(limit) : 50) // Límite por defecto
      .lean();

    res.json(jobs);
  } catch (err) {
    console.error("❌ Error al buscar empleos:", err);
    res.status(500).json({ error: "Error de servidor al buscar empleos." });
  }
});

// GET /api/jobs/:id -> Detalle
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido." });
    }
    const job = await Job.findById(id).lean();
    if (!job) return res.status(404).json({ error: "Empleo no encontrado." });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener empleo." });
  }
});


// ====================
// 🔐 Endpoints Auth (NUEVOS)
// ====================

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro_cambiar_en_env";

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    // 2. Verificar si ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // 3. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Crear usuario
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "Usuario creado con éxito. ¡Ahora iniciá sesión!" });

  } catch (err) {
    console.error("❌ Error en register:", err);
    res.status(500).json({ error: "Error al registrar usuario." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Credenciales inválidas." });
    }

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Credenciales inválidas." });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" } // El usuario no tiene que loguearse a cada rato
    );

    // 4. Responder (sin devolver la password!)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
});


// ====================
// 🤖 Cliente de OpenAI (IA CV)
// ====================

import rateLimit from "express-rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Limiter for AI endpoint: 5 requests per 15 minutes per IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint para optimizar una sección del CV (CÓDIGO COMPLETO)
app.post("/api/optimizar-cv", aiLimiter, async (req, res) => {
  const {
    section,
    content,
    jobDescription,
    language,
    targetIndustry,
    tone,   // Nuevo parámetro
    goal    // Nuevo parámetro
  } = req.body || {};

  console.log("📥 Optimizando CV con parámetros:", { section, tone, goal });

  const safeSection = section || "perfil";
  const safeContent = content || "";
  const safeLang = language === "en" ? "en" : "es";

  // 1. Definimos instrucciones específicas por SECCIÓN
  const sectionRules = {
    perfil: safeLang === "en"
      ? "Create a compelling professional summary. Highlight unique value proposition."
      : "Crea un perfil profesional impactante. Resalta la propuesta de valor única del candidato.",
    experiencias: safeLang === "en"
      ? "Use bullet points. Start with strong action verbs. Quantify results where possible."
      : "Usa viñetas (bullet points). Comienza con verbos de acción fuertes. Cuantifica resultados siempre que sea posible.",
    educacion: safeLang === "en"
      ? "Format clearly. Focus on relevant degree details."
      : "Formato claro. Enfócate en detalles académicos relevantes.",
    habilidades: safeLang === "en"
      ? "List technical and soft skills clearly. Prioritize keywords."
      : "Lista habilidades técnicas y blandas claramente. Prioriza palabras clave.",
    otros: safeLang === "en"
      ? "Summarize relevant extra info concisely."
      : "Resume información extra de forma concisa."
  };

  // 2. Definimos instrucciones según el OBJETIVO (Goal)
  const goalRules = {
    mejora: safeLang === "en" ? "Improve clarity and flow." : "Mejora la claridad y la fluidez del texto.",
    ats: safeLang === "en" ? "Optimize for ATS systems. Use standard keywords from the industry." : "Optimiza para sistemas ATS. Usa palabras clave estándar de la industria.",
    logros: safeLang === "en" ? "Rewrite focusing on measurable achievements (numbers, %, impact)." : "Reescribe enfocándote en logros medibles (números, %, impacto).",
    correccion: safeLang === "en" ? "Strictly fix grammar and spelling errors only. Do not change the meaning." : "Corrige estrictamente gramática y ortografía. No cambies el sentido ni el estilo.",
  };

  const currentSectionRule = sectionRules[safeSection] || "";
  const currentGoalRule = goalRules[goal] || goalRules["mejora"];

  // 3. Construcción del Prompt Dinámico
  const systemMessage = safeLang === "en"
    ? `You are an expert CV writer specializing in the ${targetIndustry || "general"} industry.`
    : `Eres un experto redactor de CVs especializado en la industria de ${targetIndustry || "general"}.`;

  const userMessage = safeLang === "en"
    ? `
    TASK: Rewrite the following "${safeSection}" section of a CV.
    
    CONFIGURATION:
    - Tone: ${tone || "Professional"}
    - Goal: ${currentGoalRule}
    - Specific rules for this section: ${currentSectionRule}
    
    CONTEXT:
    - Job Description target: """${jobDescription || "Not provided"}"""
    
    ORIGINAL CONTENT:
    """${safeContent}"""
    
    OUTPUT:
    Provide ONLY the rewritten content. No conversational filler.
    `
    : `
    TAREA: Reescribe la siguiente sección "${safeSection}" de un currículum.
    
    CONFIGURACIÓN:
    - Tono deseado: ${tone || "Profesional"}
    - Objetivo principal: ${currentGoalRule}
    - Reglas específicas para esta sección: ${currentSectionRule}
    
    CONTEXTO:
    - Descripción del puesto: """${jobDescription || "No provista"}"""
    
    CONTENIDO ORIGINAL:
    """${safeContent}"""
    
    SALIDA:
    Provee SOLO el contenido reescrito. Sin explicaciones ni saludos.
    `;

  // 🔹 Fallback 1: sin API key -> simulación
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ No OPENAI_API_KEY, devolviendo respuesta simulada.");
    return res.status(200).json({
      suggestion:
        (safeLang === "en"
          ? "Simulated improved version: "
          : "Versión mejorada simulada: ") + safeContent,
    });
  }

  try {
    // 4. Llamada REAL a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Asegúrate de tener acceso a este modelo, si no usa "gpt-3.5-turbo"
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const suggestion = completion.choices[0].message.content.trim();
    console.log("✅ IA devolvió sugerencia.");

    return res.status(200).json({ suggestion });

  } catch (err) {
    console.error("❌ Error en /api/optimizar-cv:", err);

    // 🔹 Fallback 2: error real -> mensaje de error amigable
    const isQuotaError =
      err?.status === 429 ||
      err?.code === "insufficient_quota" ||
      (typeof err.message === "string" && err.message.includes("quota"));

    const prefix =
      safeLang === "en"
        ? isQuotaError
          ? "Simulated improved version (AI quota exceeded):\n\n"
          : "Simulated improved version (AI error):\n\n"
        : isQuotaError
          ? "Versión mejorada simulada (la cuota de IA se agotó):\n\n"
          : "Versión mejorada simulada (hubo un error con la IA):\n\n";

    return res.status(200).json({
      suggestion: prefix + safeContent,
    });
  }
});
// ====================
// 🚀 Arranque del servidor
// ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
});
