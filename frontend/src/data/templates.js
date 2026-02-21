// ==========================================
// 🎨 CATÁLOGO DE PLANTILLAS DE CV — JOBLU
// ==========================================

export const TEMPLATES = [
    // ── GRATUITAS ──────────────────────────────────────────
    {
        id: "ats-classic",
        name: "Profesional",
        category: "Negocios · Administración",
        description: "Diseño limpio y clásico. Columna única con máxima compatibilidad con filtros ATS.",
        thumbnail: "📄",
        color: "#6337b7",
        features: ["Compatible ATS", "Alto contraste", "Estructura clara"],
        type: "free",
        isAcquired: true,
    },
    {
        id: "modern-visual",
        name: "Moderna",
        category: "Diseño · Tecnología",
        description: "Encabezado con acento de marca. Visual, impactante y diferente al resto.",
        thumbnail: "🎨",
        color: "#21dbd2",
        features: ["Acento de color", "Encabezado destacado", "Diseño moderno"],
        type: "free",
        isAcquired: true,
    },
    {
        id: "minimal-pro",
        name: "Minimalista",
        category: "Freelance · Creativo",
        description: "Tipografía grande, mucho espacio en blanco. Elegante y sofisticado.",
        thumbnail: "✦",
        color: "#3c74c2",
        features: ["Sin ruido visual", "Tipografía editorial", "Look premium"],
        type: "free",
        isAcquired: true,
    },

    // ── EXCLUSIVAS ─────────────────────────────────────────
    {
        id: "executive-dark",
        name: "Executive Dark",
        category: "Directivos · Ejecutivos",
        description: "Modo oscuro sofisticado con tipografía serif. Ideal para perfiles senior.",
        thumbnail: "🌑",
        color: "#1e1e2e",
        features: ["Dark mode", "Tipografía serif", "Look ejecutivo"],
        type: "exclusive",
        isAcquired: false,
    },
    {
        id: "creative-portfolio",
        name: "Portfolio Pro",
        category: "Diseño · Creativos",
        description: "Layout de dos columnas con sección de proyectos destacados y paleta customizable.",
        thumbnail: "🖼️",
        color: "#e040fb",
        features: ["Dos columnas", "Sección portfolio", "Color personalizable"],
        type: "exclusive",
        isAcquired: false,
    },
    {
        id: "tech-sidebar",
        name: "Tech Sidebar",
        category: "Ingeniería · IT",
        description: "Sidebar izquierdo con stack tecnológico y métricas de experiencia.",
        thumbnail: "⚡",
        color: "#00bcd4",
        features: ["Sidebar izquierdo", "Stack visual", "Métricas de XP"],
        type: "exclusive",
        isAcquired: false,
    },
];

/**
 * Devuelve el objeto de plantilla por su ID.
 * @param {string} id
 * @returns {object}
 */
export const getTemplateById = (id) =>
    TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

/** Plantillas disponibles para el usuario (gratuitas + adquiridas) */
export const getAvailableTemplates = () =>
    TEMPLATES.filter((t) => t.type === "free" || t.isAcquired);

export default TEMPLATES;
