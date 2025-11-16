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
// 🤖 Cliente de OpenAI (IA CV)
// ====================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint para optimizar una sección del CV
app.post("/api/optimizar-cv", async (req, res) => {
  const {
    section,
    content,
    jobDescription,
    language,
    targetIndustry,
  } = req.body || {};

  console.log("📥 Body recibido en /api/optimizar-cv:", req.body);

  const safeSection = section || "perfil";
  const safeContent = content || "";
  const safeLang = language === "en" ? "en" : "es";

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
    const systemMessage =
      safeLang === "en"
        ? "You are an expert CV writer and recruiter. Improve the user's CV section."
        : "Sos un experto en redacción de CVs y selección de personal. Mejorá la sección del CV del usuario.";

    const userMessage =
      safeLang === "en"
        ? `
Improve the following CV section in English.
- Keep a neutral-professional tone.
- Focus on achievements and measurable impact when possible.
- Adapt to this job description if present.
- Industry (optional): ${targetIndustry || "not specified"}.

Section: ${safeSection}
Current content:
"""${safeContent}"""

Job description:
"""${jobDescription || ""}"""

Answer ONLY with the improved text for that section, without explanations.
`
        : `
Mejorá la siguiente sección de CV en español.
- Usá un tono profesional y claro.
- Enfocate en logros y resultados medibles cuando sea posible.
- Adaptá el contenido a la descripción del puesto si está presente.
- Rubro objetivo (opcional): ${targetIndustry || "no especificado"}.

Sección: ${safeSection}
Contenido actual:
"""${safeContent}"""

Descripción del puesto:
"""${jobDescription || ""}"""

Respondé SOLO con el texto mejorado de esa sección, sin explicaciones adicionales.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    // 🔹 Fallback 2: error de cuota u otro → simulación
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
