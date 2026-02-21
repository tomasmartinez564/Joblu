/**
 * seedCommunity.js
 * ─────────────────────────────────────────────────────────────
 * Limpia la colección de posts de Comunidad e inserta datos de
 * prueba distribuidos en las 6 categorías nuevas (slugs).
 *
 * Uso:
 *   node seedCommunity.js
 *
 * Requiere: MONGODB_URI en backend/.env
 * ─────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error("❌ MONGODB_URI no encontrada en .env");
    process.exit(1);
}

// ── Guardia de entorno ────────────────────────────────────────
// Evitamos correr en producción por accidente.
const isDevEnv =
    mongoUri.includes("localhost") ||
    mongoUri.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development" ||
    process.argv.includes("--force");  // override manual

if (!isDevEnv) {
    console.warn("⚠️  La URI apunta a un entorno que no parece dev.");
    console.warn("    Pasá el flag --force para confirmar que querés ejecutarlo igual.");
    process.exit(1);
}

// ── Esquema (standalone, igual a server.js) ───────────────────
const commentSchema = new mongoose.Schema({
    authorName: String,
    content: String,
    createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        authorName: { type: String, default: "Anónimo" },
        authorEmail: { type: String, default: "" },
        category: { type: String, default: "general" },
        likedBy: [String],
        comments: [commentSchema],
    },
    { timestamps: true }
);

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

// ── Seed Data (slugs nuevos) ──────────────────────────────────
const seedPosts = [
    {
        title: "¿Cómo armar un CV sin experiencia laboral?",
        content:
            "Estoy buscando mi primer trabajo y no sé bien cómo completar la sección de experiencia. ¿Sirve poner proyectos de la facultad o cursos de Coursera?",
        authorName: "flo_dev",
        authorEmail: "flo@example.com",
        category: "Consejos CV",
    },
    {
        title: "Tips para pasar el ATS en 2024",
        content:
            "Compartiendo lo que aprendí: palabras clave del puesto, fuentes sin serifa y nada de tablas. ¿Alguien tiene más trucos?",
        authorName: "lucas_rrhh",
        authorEmail: "lucas@example.com",
        category: "Consejos CV",
    },
    {
        title: "¿Cómo responder '¿Cuál es tu mayor debilidad?'",
        content:
            "Me viene preguntando en todas las entrevistas y no sé si ser honesto o dar una respuesta genérica. ¿Qué funciona mejor?",
        authorName: "mari_disena",
        authorEmail: "mari@example.com",
        category: "Entrevistas",
    },
    {
        title: "Me hicieron una entrevista técnica en inglés — experiencia",
        content:
            "Acabo de tener mi primera entrevista en inglés para una empresa de EE.UU. Fue intimidante pero manejable. Comparto mis tips si les interesa.",
        authorName: "tomi_it",
        authorEmail: "tomi@example.com",
        category: "Entrevistas",
    },
    {
        title: "¿Vale la pena LinkedIn Premium en Argentina?",
        content:
            "Estoy evaluando pagar la suscripción para ver quién vio mi perfil y mandar InMails. ¿Alguien lo usó con resultados concretos?",
        authorName: "santi_net",
        authorEmail: "santi@example.com",
        category: "Networking",
    },
    {
        title: "Búsqueda: UX Designer Sr para startup fintech — CABA",
        content:
            "Somos un equipo de 12 personas. Ofrecemos trabajo remoto + equity + salario en dólares. Mandá tu portfolio a rrhh@fintech-ejemplo.com",
        authorName: "reclu_fintech",
        authorEmail: "rrhh@fintech-ejemplo.com",
        category: "Ofertas Laborales",
    },
    {
        title: "¿Cuánto pide un dev fullstack junior en LATAM hoy?",
        content:
            "Estoy armando mi propuesta de honorarios y no sé bien el rango actual. ¿Dólares o pesos? ¿Relación de dependencia o freelance?",
        authorName: "juani_code",
        authorEmail: "juani@example.com",
        category: "Dudas Técnicas",
    },
    {
        title: "Diferencia entre async/await y Promises en entrevistas",
        content:
            "En dos entrevistas me preguntaron esto y no supe explicarlo con claridad. ¿Alguien puede compartir una explicación simple?",
        authorName: "belu_js",
        authorEmail: "belu@example.com",
        category: "Dudas Técnicas",
    },
    {
        title: "Presentación — nueva a la comunidad",
        content:
            "¡Hola! Soy Verónica, diseñadora UX/UI de Rosario. Me acabo de unir a JOBLU buscando trabajo remoto. ¡Feliz de conocerlos!",
        authorName: "vero_ux",
        authorEmail: "vero@example.com",
        category: "General",
    },
    {
        title: "¿Qué herramientas usan para gestionar la búsqueda laboral?",
        content:
            "Yo uso una planilla de Notion para trackear cada postulación. ¿Hay algo mejor? ¿Trello, Airtable, alguna app específica?",
        authorName: "pablo_pm",
        authorEmail: "pablo@example.com",
        category: "General",
    },
];

// ── Ejecución ─────────────────────────────────────────────────
async function seedCommunity() {
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Conectado a MongoDB:", mongoUri.replace(/\/\/.*@/, "//***@"));

        console.log("🧹 Limpiando colección de posts...");
        const { deletedCount } = await Post.deleteMany({});
        console.log(`   ${deletedCount} posts eliminados.`);

        console.log("🌱 Insertando seed data...");
        const inserted = await Post.insertMany(
            seedPosts.map((p) => ({ ...p, likedBy: [], comments: [] }))
        );
        console.log(`✅ ${inserted.length} posts insertados correctamente.`);

        // Resumen por categoría
        const byCategory = inserted.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});
        console.log("\n📊 Distribución por categoría:");
        for (const [cat, count] of Object.entries(byCategory)) {
            console.log(`   ${cat}: ${count} post${count > 1 ? "s" : ""}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error en el seed:", err);
        process.exit(1);
    }
}

seedCommunity();
