import { useState, useEffect } from "react";

function AccountSettings({ user, onUpdateUser, theme, onChangeTheme }) {
  if (!user) {
    return (
      <section className="account">
        <h2>Cuenta</h2>
        <p className="account-subtitle">
          Iniciá sesión para gestionar tu cuenta, apariencia y datos personales.
        </p>
      </section>
    );
  }

  const [displayName, setDisplayName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  useEffect(() => {
    setDisplayName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();

    if (!displayName || !email) {
      alert("Completá nombre y email.");
      return;
    }

    onUpdateUser({ name: displayName, email });
    alert("Datos de cuenta actualizados (solo frontend, sin backend).");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !repeatPassword) {
      alert("Completá todos los campos de contraseña.");
      return;
    }

    if (newPassword !== repeatPassword) {
      alert("La nueva contraseña y la repetición no coinciden.");
      return;
    }

    // En una app real acá llamarías al backend
    alert("Cambio de contraseña simulado (en un backend real se aplicaría).");

    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
  };

  const handleThemeChange = (e) => {
    onChangeTheme(e.target.value);
  };

  return (
    <section className="account">
      <h2>Cuenta</h2>
      <p className="account-subtitle">
        Gestioná tus datos personales, tu email y cómo se ve la aplicación.
      </p>

      <div className="account-grid">
        {/* Perfil */}
        <div className="account-card">
          <h3>Datos de perfil</h3>
          <p className="account-hint">
            Estos datos se usan para mostrar tu nombre en la app y, más
            adelante, para cosas como el saludo o plantillas por defecto.
          </p>

          <form className="account-form" onSubmit={handleProfileSubmit}>
            <label>
              Nombre visible
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: Sofi, Lucas, Marta"
              />
            </label>

            <label>
              Email de la cuenta
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@mail.com"
              />
            </label>

            <button type="submit" className="account-btn primary">
              Guardar cambios
            </button>
          </form>
        </div>

        {/* Contraseña */}
        <div className="account-card">
          <h3>Contraseña</h3>
          <p className="account-hint">
            Por ahora esto es solo una simulación de la UI. En un proyecto real,
            estos datos se enviarían al servidor de forma segura.
          </p>

          <form className="account-form" onSubmit={handlePasswordSubmit}>
            <label>
              Contraseña actual
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>

            <label>
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <label>
              Repetir nueva contraseña
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
            </label>

            <button type="submit" className="account-btn">
              Cambiar contraseña
            </button>
          </form>
        </div>

        {/* Apariencia */}
        <div className="account-card">
          <h3>Apariencia</h3>
          <p className="account-hint">
            Elegí entre modo claro u oscuro. Más adelante podrías agregar “usar
            tema del sistema”.
          </p>

          <div className="account-theme-options">
            <label className="account-radio">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === "light"}
                onChange={handleThemeChange}
              />
              <span>Modo claro</span>
            </label>

            <label className="account-radio">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === "dark"}
                onChange={handleThemeChange}
              />
              <span>Modo oscuro</span>
            </label>
          </div>

          <p className="account-hint">
            El modo oscuro afecta al fondo, tarjetas y texto principal de la
            app.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AccountSettings;
