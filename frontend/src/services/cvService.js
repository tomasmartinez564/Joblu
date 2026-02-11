import API_BASE_URL from "../config/api";

const cvService = {
    // Obtener headers de autenticación
    getAuthHeaders: () => {
        const token = localStorage.getItem("joblu_token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    },

    // Obtener todos los CVs
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

    // Obtener un CV por ID
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

    // Crear un nuevo CV
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

    // Actualizar un CV existente
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

    // Importar un CV desde archivo (PDF/TXT)
    importCv: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("joblu_token");
        const response = await fetch(`${API_BASE_URL}/api/cvs/import`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                // No Content-Type header when sending FormData, browser sets multipart/form-data with boundary
            },
            body: formData,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Error al importar el CV");
        }
        return await response.json();
    },

    // Eliminar un CV
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
            method: "DELETE",
            headers: cvService.getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Error al eliminar el CV");
        return await response.json();
    },

    // Optimizar CV con IA
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
