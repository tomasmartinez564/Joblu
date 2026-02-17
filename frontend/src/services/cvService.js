import API_BASE_URL from "../config/api";

// ==========================================
// 🚀 SERVICIO: CV (Currículums)
// ==========================================
const cvService = {
    
    // --- 1. Utilidades y Autenticación ---

    /**
     * Genera los headers necesarios para peticiones autenticadas.
     */
    getAuthHeaders: () => {
        const token = localStorage.getItem("joblu_token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    },

    // --- 2. Operaciones de Datos (CRUD) ---

    /**
     * Obtiene todos los CVs del usuario actual.
     */
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/api/cvs`, {
            headers: cvService.getAuthHeaders(),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al obtener CVs");
        }
        return await response.json();
    },

    /**
     * Obtiene un CV específico por su ID.
     */
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
            headers: cvService.getAuthHeaders(),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al obtener el CV");
        }
        return await response.json();
    },

    /**
     * Crea un nuevo currículum.
     */
    create: async (cvData) => {
        const response = await fetch(`${API_BASE_URL}/api/cvs`, {
            method: "POST",
            headers: cvService.getAuthHeaders(),
            body: JSON.stringify(cvData),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al crear el CV");
        }
        return await response.json();
    },

    /**
     * Actualiza los datos de un CV existente.
     */
    update: async (id, cvData) => {
        const response = await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
            method: "PUT",
            headers: cvService.getAuthHeaders(),
            body: JSON.stringify(cvData),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al actualizar el CV");
        }
        return await response.json();
    },

    /**
     * Elimina un CV permanentemente.
     */
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
            method: "DELETE",
            headers: cvService.getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Error al eliminar el CV");
        return await response.json();
    },

    // --- 3. Funciones Especiales e IA ---

    /**
     * Importa un archivo (PDF o TXT) y lo procesa para crear un CV.
     */
    importCv: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("joblu_token");
        const response = await fetch(`${API_BASE_URL}/api/cvs/import`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                // No enviamos Content-Type para que el navegador configure el multipart/form-data
            },
            body: formData,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al importar el CV");
        }
        return await response.json();
    },

    /**
     * Envía contenido a la IA para recibir sugerencias de mejora.
     */
    optimize: async ({ section, content, jobDescription, language, targetIndustry, tone, goal }) => {
        const response = await fetch(`${API_BASE_URL}/api/optimizar-cv`, {
            method: "POST",
            headers: cvService.getAuthHeaders(),
            body: JSON.stringify({
                section,
                content,
                jobDescription,
                language,
                targetIndustry,
                tone,
                goal
            }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al conectar con la IA");
        }
        return await response.json();
    },
};

export default cvService;