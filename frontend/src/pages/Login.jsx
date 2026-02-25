import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// --- Contexto y Estilos ---
import { useToast } from '../context/ToastContext';
import '../styles/login.css';

import API_BASE_URL from "../config/api";

// ==========================================
// 🔐 PÁGINA: LOGIN / REGISTRO (Login)
// ==========================================
function Login({ onLogin }) {
  // --- 1. Estados ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // --- 2. Hooks ---
  const navigate = useNavigate();
  const { addToast } = useToast();

  // --- 3. Manejadores de Eventos (Handlers) ---

  /**
   * Actualiza el estado del formulario al escribir en los inputs.
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Gestiona el envío del formulario para Login o Registro.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Usamos API_BASE_URL para que coincida con la configuración global
    const endpoint = isRegistering
      ? `${API_BASE_URL}/api/auth/register`
      : `${API_BASE_URL}/api/auth/login`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error inesperado');
      }

      if (isRegistering) {
        // Éxito en registro: notificamos y logueamos automáticamente
        addToast(`¡Cuenta creada con éxito! Bienvenido, ${data.user.name} 👋`, 'success');
        onLogin(data.user, data.token, '/');
      } else {
        // Éxito en login: notificamos y actualizamos estado global
        addToast(`Bienvenido de nuevo, ${data.user.name} 👋`, 'success');
        onLogin(data.user, data.token, '/'); // Pasamos user y token a App.jsx y redirigimos al inicio
      }

    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  // --- 4. Renderizado ---
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Cabecera dinámica */}
        <h2 className="login-title">
          {isRegistering ? 'Crear cuenta en JOBLU' : 'Iniciar Sesión'}
        </h2>
        <p className="login-subtitle">
          {isRegistering
            ? 'Unite a la comunidad y potenciá tu carrera.'
            : 'Accedé a tus CVs y empleos guardados.'}
        </p>

        {/* Formulario de acceso */}
        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ej: Tomás Martínez"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={isLoading}
          >
            {isLoading
              ? 'Procesando...'
              : (isRegistering ? 'Registrarme' : 'Ingresar')
            }
          </button>
        </form>

        {/* Alternar entre Login y Registro */}
        <div className="login-footer">
          <p>
            {isRegistering ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}
            <button
              type="button"
              className="login-toggle"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Iniciá sesión' : 'Registrate gratis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;