import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext' // Importamos nuestros Toasts
import '../styles/login.css'

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const { addToast } = useToast() // Hook de notificaciones

  // Manejo de inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const endpoint = isRegistering 
      ? 'http://localhost:3000/api/auth/register' 
      : 'http://localhost:3000/api/auth/login'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error inesperado')
      }

      if (isRegistering) {
        // Éxito en registro
        addToast('¡Cuenta creada! Ahora iniciá sesión.', 'success')
        setIsRegistering(false) // Cambiar a modo login
      } else {
        // Éxito en login
        addToast(`Bienvenido de nuevo, ${data.user.name} 👋`, 'success')
        onLogin(data.user, data.token) // Pasamos user y token a App.jsx
      }

    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">
          {isRegistering ? 'Crear cuenta en Joblu' : 'Iniciar Sesión'}
        </h2>
        <p className="login-subtitle">
          {isRegistering 
            ? 'Unite a la comunidad y potenciá tu carrera.' 
            : 'Accedé a tus CVs y empleos guardados.'}
        </p>

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
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
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
  )
}

export default Login