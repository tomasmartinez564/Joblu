import rateLimit from "express-rate-limit";

// Limitador para rutas de IA
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Demasiadas peticiones. Intenta de nuevo más tarde." }
});
