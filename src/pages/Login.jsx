import { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!email || !password) {
      alert('Completá email y contraseña')
      return
    }

    // Llamamos al manejador que viene desde App
    onLogin({ email })
  }

  return (
    <section className="login">
      <h2>Iniciar sesión</h2>
      <p className="login-subtitle">
        Accedé a tus CVs guardados y configuraciones personalizadas.
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            placeholder="ejemplo@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="login-btn">
          Entrar
        </button>
      </form>

      <p className="login-hint">
        Más adelante podés agregar registro, recuperación de contraseña, etc.
      </p>
    </section>
  )
}

export default Login
