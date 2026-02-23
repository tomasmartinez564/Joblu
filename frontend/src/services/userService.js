import API_BASE_URL from "../config/api";

const getHeaders = () => {
    const token = localStorage.getItem("joblu_token");
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

export const userService = {
    getPublicProfile: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/profile/${encodeURIComponent(email)}`, {
                method: "GET",
                headers: getHeaders(),
            });

            if (!response.ok) {
                throw new Error("Error al obtener el perfil del usuario.");
            }

            return await response.json();
        } catch (error) {
            console.error("Error en getPublicProfile:", error);
            throw error;
        }
    },
};
