import { useState, useRef, useEffect } from "react";

// --- Estilos y Configuración ---
import API_BASE_URL from "../config/api";
import "../styles/account.css";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/common/UserAvatar";

// ==========================================
// 👤 PÁGINA: AJUSTES DE CUENTA (AccountSettings)
// ==========================================
function AccountSettings({ user, onUpdateUser }) {
  const { addToast } = useToast();

  // --- 0. Estado: Navegación de Tabs ---
  const [activeTab, setActiveTab] = useState("profile"); // profile, security, preferences, notifications, account

  // --- 1. Estados: Información de Perfil ---
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- 2. Estados: Seguridad (Contraseñas) ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // --- 3. Estados: Preferencias JOBLU ---
  const [jobType, setJobType] = useState(user?.jobType || "remoto");
  const [seniority, setSeniority] = useState(user?.seniority || "ssr");
  const [areas, setAreas] = useState(user?.areas || ["Software Development"]);

  const toggleArea = (area) => {
    setAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("joblu_token")}`,
        },
        body: JSON.stringify({ jobType, seniority, areas }),
      });

      if (!response.ok) throw new Error("Error al guardar");

      const updatedUser = await response.json();
      onUpdateUser(updatedUser);
      addToast("Preferencias guardadas correctamente.", "success");
    } catch (err) {
      console.error(err);
      addToast("Error al guardar las preferencias.", "error");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // --- 4. Estados: Notificaciones (Mock Local) ---
  const [notifyJobs, setNotifyJobs] = useState(true);
  const [notifyCommunity, setNotifyCommunity] = useState(true);
  const [notifyTips, setNotifyTips] = useState(false);

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    addToast("Preferencias de notificaciones actualizadas.", "success");
  };

  // --- 5. Efectos: Sincronización ---
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setAvatarPreview(user.avatar || "");
      if (user.jobType) setJobType(user.jobType);
      if (user.seniority) setSeniority(user.seniority);
      if (user.areas) setAreas(user.areas);
    }
  }, [user]);

  // --- 6. Manejadores de Eventos: Avatar ---
  const handleAvatarClick = () => fileInputRef.current.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  // --- 7. Manejadores de Eventos: Perfil y Seguridad ---
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateUser({ name: displayName });
    addToast("Perfil actualizado correctamente.", "success");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    addToast("Cambio de contraseña no implementado aún.", "info");
  };

  // --- 8. Renderizado de Secciones ---
  const renderProfile = () => (
    <div className="account-card fade-in">
      <div className="card-header">
        <h3>Datos Personales</h3>
        <p>Actualizá tu foto y cómo te ven los demás.</p>
      </div>

      <div className="account-card__body">
        <div className="avatar-section">
          <div
            className={`avatar-wrapper ${isUploading ? "uploading" : ""}`}
            onClick={handleAvatarClick}
          >
            <UserAvatar
              src={avatarPreview}
              name={displayName || user?.name}
              className="user-avatar-lg"
              alt="Avatar"
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
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="account-card fade-in">
      <div className="card-header">
        <h3>Seguridad</h3>
        <p>Actualizá tu contraseña para mantener tu cuenta protegida.</p>
      </div>

      <div className="security-content account-card__body">
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
          <div className="form-actions">
            <button type="submit" className="btn-secondary">Actualizar Contraseña</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="account-card fade-in">
      <div className="card-header">
        <h3>Preferencias JOBLU</h3>
        <p>Configurá cómo querés recibir oportunidades y tu stack ideal.</p>
      </div>
      <form className="account-form account-card__body" onSubmit={handlePreferencesSubmit}>

        <div className="preferences-grid">
          <div className="input-group">
            <label htmlFor="job-type">Modalidad preferida</label>
            <select id="job-type" className="account-select" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="remoto">100% Remoto</option>
              <option value="hibrido">Híbrido</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="seniority">Nivel de Seniority</label>
            <select id="seniority" className="account-select" value={seniority} onChange={(e) => setSeniority(e.target.value)}>
              <option value="trainee">Trainee</option>
              <option value="jr">Junior</option>
              <option value="ssr">Semi-Senior</option>
              <option value="sr">Senior</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Áreas de interés</label>
          <p className="hint" style={{ textAlign: 'left', margin: '0 0 0.5rem 0' }}>Elegí las áreas que más te interesan para personalizar recomendaciones.</p>
          <div className="preferences-chips">
            {["Software Development", "Design", "Marketing", "Sales", "Data", "Product"].map(area => (
              <button
                key={area}
                type="button"
                className={`account-chip ${areas.includes(area) ? 'active' : ''}`}
                onClick={() => toggleArea(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSavingPreferences}>
            {isSavingPreferences ? "Guardando..." : "Guardar Preferencias"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotifications = () => (
    <div className="account-card fade-in">
      <div className="card-header">
        <h3>Notificaciones</h3>
        <p>Elegí qué tipo de mensajes querés recibir en tu email.</p>
      </div>
      <form className="account-form account-card__body" onSubmit={handleNotificationsSubmit}>

        <div className="notification-list">
          <label className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-title">Alertas de empleo</span>
              <span className="toggle-desc">Recibí ofertas acordes a tus preferencias.</span>
            </div>
            <div className="toggle-switch">
              <input type="checkbox" checked={notifyJobs} onChange={(e) => setNotifyJobs(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
          </label>

          <label className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-title">Novedades de la comunidad</span>
              <span className="toggle-desc">Enterate de los debates y recursos más populares.</span>
            </div>
            <div className="toggle-switch">
              <input type="checkbox" checked={notifyCommunity} onChange={(e) => setNotifyCommunity(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
          </label>

          <label className="toggle-row">
            <div className="toggle-info">
              <span className="toggle-title">Tips de CV y entrevistas</span>
              <span className="toggle-desc">Recibí consejos para destacar tu perfil.</span>
            </div>
            <div className="toggle-switch">
              <input type="checkbox" checked={notifyTips} onChange={(e) => setNotifyTips(e.target.checked)} />
              <span className="toggle-slider"></span>
            </div>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Guardar Cambios</button>
        </div>
      </form>
    </div>
  );

  const renderAccountActions = () => (
    <div className="account-card fade-in">
      <div className="card-header">
        <h3>Acciones de la Cuenta</h3>
        <p>Gestioná el acceso y estado de tu cuenta JOBLU.</p>
      </div>

      <div className="account-actions-list account-card__body">
        <div className="action-row">
          <div className="action-info">
            <span className="action-title">Cerrar sesión</span>
            <span className="action-desc">Cerrá tu sesión en este dispositivo.</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => addToast("Para cerrar sesión usá el menú superior del avatar.", "info")}
          >
            Cerrar sesión
          </button>
        </div>

        <div className="account-danger-zone">
          <div className="account-danger-zone__header">
            <span className="account-danger-zone__title">Desactivar / Eliminar cuenta</span>
            <span className="account-badge-soon">Próximamente</span>
          </div>
          <p className="action-desc">Borrará permanentemente tu CV, postulaciones y datos de la plataforma.</p>
          <button
            type="button"
            className="btn-danger account-danger-button"
            disabled
            aria-label="Función Eliminar cuenta próximamente"
          >
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );

  // --- 9. Renderizado Principal ---
  return (
    <div className="account-page">
      <div className="account-container">
        <header className="account-page-header fade-in">
          <h1 className="account-page-title">Mi Cuenta</h1>
          <p className="account-page-subtitle">
            Gestioná tu identidad y la seguridad de tu acceso.
          </p>
        </header>

        <div className="account-layout-shell">
          <div className="account-layout">
            {/* Sidebar sticky */}
            <aside className="account-sidebar">
              <nav className="account-nav" aria-label="Secciones de mi cuenta">
                <button className={`account-nav-button ${activeTab === 'profile' ? 'is-active' : ''}`} onClick={() => setActiveTab('profile')}>
                  Perfil
                </button>
                <button className={`account-nav-button ${activeTab === 'security' ? 'is-active' : ''}`} onClick={() => setActiveTab('security')}>
                  Seguridad
                </button>
                <button className={`account-nav-button ${activeTab === 'preferences' ? 'is-active' : ''}`} onClick={() => setActiveTab('preferences')}>
                  Preferencias JOBLU
                </button>
                <button className={`account-nav-button ${activeTab === 'notifications' ? 'is-active' : ''}`} onClick={() => setActiveTab('notifications')}>
                  Notificaciones
                </button>
                <button className={`account-nav-button ${activeTab === 'account' ? 'is-active' : ''}`} onClick={() => setActiveTab('account')}>
                  Cuenta
                </button>
              </nav>
            </aside>

            {/* Panel contenido */}
            <section className="account-content">
              {activeTab === 'profile' && renderProfile()}
              {activeTab === 'security' && renderSecurity()}
              {activeTab === 'preferences' && renderPreferences()}
              {activeTab === 'notifications' && renderNotifications()}
              {activeTab === 'account' && renderAccountActions()}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;