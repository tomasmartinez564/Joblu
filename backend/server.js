import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
    likes: {
      type: Number,
      default: 0, // 👈 nuevo campo
    },
  },
  {
    timestamps: true,
  }
);

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

// POST /api/community/posts/:id/like -> sumar o restar like
app.post("/api/community/posts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {}; // 'like' o 'unlike'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de post inválido." });
    }

    const increment = action === "unlike" ? -1 : 1;

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes: increment } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado." });
    }

    if (post.likes < 0) {
      post.likes = 0;
      await post.save();
    }

    res.json(post);
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
// 💼 Modelo y Endpoints Empleos (Jobs)
// ====================

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String }, // e.g. "Remote", "USA", etc.
    type: { type: String }, // e.g. "full_time", "freelance"
    description: { type: String }, // HTML description usually
    url: { type: String }, // Link to apply
    salary: { type: String }, // Optional
    externalId: { type: String }, // ID from the external API to avoid dupes
    tags: [String],
    logo: { type: String },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

// GET /api/jobs -> listar empleos
app.get("/api/jobs", async (req, res) => {
  try {
    // Podríamos agregar filtros por query params (tipo, tags, etc.)
    const jobs = await Job.find().sort({ publishedAt: -1 }).limit(100).lean();
    res.json(jobs);
  } catch (err) {
    console.error("❌ Error al obtener empleos:", err);
    res.status(500).json({ error: "Error al obtener la lista de empleos." });
  }
});

// GET /api/jobs/:id -> obtener un empleo por ID
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de empleo inválido." });
    }

    const job = await Job.findById(id).lean();

    if (!job) {
      return res.status(404).json({ error: "Empleo no encontrado." });
    }

    res.json(job);
  } catch (err) {
    console.error("❌ Error al obtener empleo por id:", err);
    res.status(500).json({ error: "Error al obtener el empleo." });
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
