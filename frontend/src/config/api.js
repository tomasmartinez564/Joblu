// ==========================================
// 🌐 CONFIGURACIÓN: API URL
// ==========================================

/**
 * Define la URL base para las peticiones al backend.
 * Prioriza la variable de entorno y usa localhost como fallback.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default API_BASE_URL;