import { createContext, useState, useContext, useCallback } from 'react';

// Estilos específicos para las notificaciones
import '../styles/toast.css';

// --- Contexto ---
const ToastContext = createContext();

// --- Hook Personalizado ---
export const useToast = () => useContext(ToastContext);

// ==========================================
// 🍞 PROVEEDOR DE NOTIFICACIONES (Toasts)
// ==========================================
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // --- Funciones de Gestión (Handlers) ---

  /**
   * Elimina un toast del estado.
   * Primero activa la animación de salida y luego limpia el DOM.
   */
  const removeToast = (id) => {
    // 1. Marcar para animación de cierre (CSS)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );

    // 2. Remover físicamente después de la animación (0.3s)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  /**
   * Agrega una nueva notificación a la cola.
   * @param {string} message - Texto a mostrar.
   * @param {string} type - 'success', 'error' o 'info'.
   */
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, message, type, closing: false };

    setToasts((prev) => [...prev, newToast]);

    // Programar auto-eliminación (3 segundos)
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  // --- Renderizado ---
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Contenedor global de notificaciones */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type} ${toast.closing ? 'closing' : ''}`}
          >
            {/* Iconos basados en emoji para evitar dependencias extra */}
            <span className="toast-icon">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};