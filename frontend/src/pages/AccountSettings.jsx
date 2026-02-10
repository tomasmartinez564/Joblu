import { useState, useRef, useEffect } from "react";
import API_BASE_URL from "../config/api";
import "../styles/account.css";

function AccountSettings({ user, onUpdateUser }) {
  // Sincronizar estados locales con los datos del usuario cuando estos cambian
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // IMPORTANTE: Este efecto asegura que si el usuario cambia (ej: por un reload o update), 
  // los campos del formulario se actualicen.
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setAvatarPreview(user.avatar || "");
    }
  }, [user]);

  const handleAvatarClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Previsualización local inmediata para feedback UX
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

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", response.status, errorText);

        // Intentar extraer un mensaje de error más específico
        if (errorText.includes("File too large")) {
          alert("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.");
        } else if (errorText.includes("Solo se permiten imágenes")) {
          alert("Solo se permiten archivos de imagen (JPG, PNG, etc.).");
        } else {
          alert(`Error del servidor (${response.status}). Por favor intenta de nuevo.`);
        }
        return;
      }

      const data = await response.json();
      if (data.avatarUrl) {
        // Actualizamos el usuario global. El useEffect de arriba se encargará 
        // de refrescar esta pantalla.
        onUpdateUser({ avatar: data.avatarUrl });

        // Mostrar mensaje de éxito (opcional, puedes agregar un toast si tienes uno)
        console.log("✅ Avatar actualizado correctamente");
      } else if (data.error) {
        console.error("Error del servidor:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error subiendo avatar:", error);
      alert("Error al subir el avatar. Por favor intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    alert("Cambio de contraseña simulado.");
  };

  return (
    <section className="account">
      <div className="account-header">
        <h2>Mi Cuenta</h2>
        <p>Gestioná tu identidad y la seguridad de tu acceso.</p>
      </div>

      <div className="account-grid">
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
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="hint">JPG o PNG, máx 5MB</p>
          </div>

          <form className="account-form" onSubmit={(e) => {
            e.preventDefault();
            onUpdateUser({ name: displayName });
          }}>
            <div className="input-group">
              <label>Nombre Visible</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej: Tomas Martinez"
              />
            </div>
            <div className="input-group">
              <label>Email de la cuenta</label>
              <input
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

        <div className="account-card full-width">
          <div className="security-content">
            <h3>Seguridad</h3>
            <p className="account-hint">Actualizá tu contraseña para mantener tu cuenta protegida.</p>

            <form className="password-form" onSubmit={handlePasswordSubmit}>
              <div className="password-grid">
                <div className="input-group">
                  <label>Contraseña Actual</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="input-group">
                  <label>Nueva Contraseña</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                </div>
                <div className="input-group">
                  <label>Repetir Nueva Contraseña</label>
                  <input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} placeholder="Confirmá tu contraseña" />
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