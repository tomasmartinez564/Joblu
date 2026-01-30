import { useState, useEffect } from "react";
import "../styles/account.css";


function AccountSettings({ user, onUpdateUser, settings, onChangeSettings }) {
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

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");


  useEffect(() => {
    setDisplayName(user.name || "");
    setEmail(user.email || "");
  }, [user]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();

    // limpiar mensajes previos
    setProfileError("");
    setProfileSuccess("");

    if (!displayName || !email) {
      setProfileError("Completá nombre y email.");
      return;
    }

    onUpdateUser({ name: displayName, email });
    setProfileSuccess("Datos de cuenta actualizados (solo frontend, sin backend).");
  };


  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    // limpiar mensajes previos
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !repeatPassword) {
      setPasswordError("Completá todos los campos de contraseña.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setPasswordError("La nueva contraseña y la repetición no coinciden.");
      return;
    }

    // En una app real acá llamarías al backend
    setPasswordSuccess("Cambio de contraseña simulado (en un backend real se aplicaría).");

    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
  };

  return (
    <section className="account">
      <h2>Cuenta</h2>
      <p className="account-subtitle">
        Gestioná tus datos personales, tu email y la apariencia de la app.
      </p>

      {/* Preferencias Globales (Dark Mode) */}
      <div className="account-card" style={{ marginBottom: "2rem" }}>
        <h3>Apariencia</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
          <label className="toggle-switch" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings?.darkMode || false}
              onChange={(e) => onChangeSettings({ ...settings, darkMode: e.target.checked })}
              style={{ accentColor: "var(--joblu-primary)", transform: "scale(1.2)" }}
            />
            <span style={{ fontSize: "1rem", fontWeight: 500 }}>Modo Oscuro 🌙</span>
          </label>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--joblu-text-muted)" }}>
            (Cambia el tema de toda la aplicación)
          </p>
        </div>
      </div>

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

            {profileError && (
              <p className="account-message account-message--error">
                {profileError}
              </p>
            )}

            {profileSuccess && (
              <p className="account-message account-message--success">
                {profileSuccess}
              </p>
            )}
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

            {passwordError && (
              <p className="account-message account-message--error">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="account-message account-message--success">
                {passwordSuccess}
              </p>
            )}
          </form>

        </div>
      </div>
    </section>
  );
}

export default AccountSettings;
