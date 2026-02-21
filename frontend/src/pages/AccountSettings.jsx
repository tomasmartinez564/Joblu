import { useState, useRef, useEffect } from "react";

// --- Estilos y Configuración ---
import API_BASE_URL from "../config/api";
import "../styles/account.css";
import { useToast } from "../context/ToastContext";

// ==========================================
// 👤 PÁGINA: AJUSTES DE CUENTA (AccountSettings)
// ==========================================
function AccountSettings({ user, onUpdateUser }) {
  const { addToast } = useToast();

  // --- 1. Estados: Información de Perfil ---
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- 2. Estados: Seguridad (Contraseñas) ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // --- 3. Efectos: Sincronización ---
  /**
   * Asegura que los campos locales se actualicen si los datos del usuario 
   * cambian externamente (ej. recarga o actualización global).
   */
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setAvatarPreview(user.avatar || "");
    }
  }, [user]);

  // --- 4. Manejadores de Eventos: Avatar ---

  const handleAvatarClick = () => fileInputRef.current.click();

  /**
   * Gestiona la subida de la imagen de perfil al servidor.
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Previsualización local inmediata para mejorar el UX
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/upload-avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("joblu_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", response.status, errorText);

        if (errorText.includes("File too large")) {
          addToast("El archivo es demasiado grande. Máximo 5MB.", "error");
        } else if (errorText.includes("Solo se permiten imágenes")) {
          addToast("Solo se permiten archivos de imagen (JPG, PNG, etc.).", "error");
        } else {
          addToast(`Error del servidor (${response.status}). Intentá de nuevo.`, "error");
        }
        return;
      }

      const data = await response.json();
      if (data.avatarUrl) {
        // Actualización en el estado global de la aplicación
        onUpdateUser({ avatar: data.avatarUrl });
        console.log("✅ Avatar actualizado correctamente");
      } else if (data.error) {
        addToast(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      console.error("Error subiendo avatar:", error);
      addToast("Error al subir el avatar.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 5. Manejadores de Eventos: Perfil y Seguridad ---

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateUser({ name: displayName });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    addToast("Cambio de contraseña no implementado aún.", "info");
  };

  // --- 6. Renderizado ---
  return (
    <section className="account">
      {/* Cabecera */}
      <div className="account-header">
        <h2>Mi Cuenta</h2>
        <p>Gestioná tu identidad y la seguridad de tu acceso.</p>
      </div>

      <div className="account-grid">
        {/* Tarjeta 1: Información de Perfil */}
        <div className="account-card">
          <div className="avatar-section">
            <div
              className={`avatar-wrapper ${isUploading ? "uploading" : ""}`}
              onClick={handleAvatarClick}
            >
              <img
                src={avatarPreview || "/logo.png"}
                alt="Avatar"
                className="user-avatar-lg"
              />
              <div className="avatar-overlay">Cambiar</div>
            </div>
            <input
              type="file"
              id="avatar-file-input"
              ref={fileInputRef}
              hidden
              accept="image/*"
              aria-label="Cambiar foto de perfil"
              onChange={handleFileChange}
            />
            <p className="hint">JPG o PNG, máx 5MB</p>
          </div>

          <form className="account-form" onSubmit={handleProfileSubmit}>
            <div className="input-group">
              <label htmlFor="account-display-name">Nombre Visible</label>
              <input
                id="account-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: Tomás Martínez"
              />
            </div>
            <div className="input-group">
              <label htmlFor="account-email">Email de la cuenta</label>
              <input
                id="account-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="input-disabled"
              />
              <p className="hint">El email no puede modificarse.</p>
            </div>
            <button type="submit" className="btn-primary">Guardar Cambios</button>
          </form>
        </div>

        {/* Tarjeta 2: Seguridad */}
        <div className="account-card full-width">
          <div className="security-content">
            <h3>Seguridad</h3>
            <p className="account-hint">Actualizá tu contraseña para mantener tu cuenta protegida.</p>

            <form className="password-form" onSubmit={handlePasswordSubmit}>
              <div className="password-grid">
                <div className="input-group">
                  <label htmlFor="current-password">Contraseña Actual</label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="new-password">Nueva Contraseña</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="repeat-password">Repetir Nueva Contraseña</label>
                  <input
                    id="repeat-password"
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Confirmá tu contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button type="submit" className="btn-secondary">Actualizar Contraseña</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AccountSettings;