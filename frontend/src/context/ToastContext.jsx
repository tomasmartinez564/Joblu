import { createContext, useState, useContext, useCallback } from 'react';
import '../styles/toast.css'; // Importamos los estilos

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Función para agregar un toast
  // type puede ser: 'success', 'error', 'info'
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, message, type, closing: false };

    setToasts((prev) => [...prev, newToast]);

    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = (id) => {
    // Primero marcamos como "closing" para animar la salida
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );

    // Esperamos a que termine la animación CSS (0.3s) para sacarlo del DOM
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Renderizamos los toasts aquí mismo para no ensuciar App.jsx */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type} ${toast.closing ? 'closing' : ''}`}
          >
            {/* Íconos simples con emoji por ahora para no depender de librerías */}
            <span>
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};