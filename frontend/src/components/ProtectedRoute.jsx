import { Navigate } from "react-router-dom";

/**
 * Componente que protege rutas privadas.
 * Si no hay usuario autenticado, redirige a /login.
 */
export default function ProtectedRoute({ user, children }) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
}
