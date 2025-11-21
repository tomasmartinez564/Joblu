import { useState } from "react";
import "../styles/login.css";


function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Completá email y contraseña.");
      return;
    }

    // Si está todo bien, limpiamos el error y llamamos al manejador que viene desde App
    setError("");
    onLogin({ email });
  };

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
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
          />
        </label>

        <button type="submit" className="login-btn">
          Entrar
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}

      <p className="login-hint">
        Más adelante podés agregar registro, recuperación de contraseña, etc.
      </p>
    </section>
  );
}

export default Login;
