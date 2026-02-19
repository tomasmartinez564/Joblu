import "../styles/settings.css";

// ==========================================
// ⚙️ PÁGINA: CONFIGURACIÓN (Settings)
// ==========================================
function Settings({ user, settings, onChangeSettings }) {
  
  // --- 1. Validación de Sesión ---
  if (!user) {
    return (
      <section className="settings">
        <h2>Configuración</h2>
        <p className="settings-subtitle">Iniciá sesión para personalizar tus preferencias.</p>
      </section>
    );
  }

  // --- 2. Manejadores de Eventos (Handlers) ---

  /**
   * Cambia el valor booleano de una preferencia (switches).
   */
  const handleToggle = (name) => {
    onChangeSettings({
      ...settings,
      [name]: !settings[name],
    });
  };

  /**
   * Actualiza el valor de un campo de texto o selección (inputs/selects).
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChangeSettings({
      ...settings,
      [name]: value,
    });
  };

  // --- 3. Renderizado ---
  return (
    <section className="settings">
      {/* Cabecera de la página */}
      <div className="settings-header">
        <h2>Configuración</h2>
        <p>Personalizá cómo JOBLU te ayuda a conseguir trabajo.</p>
      </div>

      <div className="settings-grid">
        
        {/* Tarjeta: Experiencia de Usuario */}
        <div className="settings-card">
          <h3>Experiencia de Usuario</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <label>Mostrar Tips</label>
              <p>Habilitar recomendaciones de ayuda en el editor.</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                name="showTips"
                checked={settings.showTips} 
                onChange={() => handleToggle("showTips")}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Incluir Foto en CV</label>
              <p>Define si las plantillas incluyen tu avatar.</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                name="includePhoto"
                checked={settings.includePhoto} 
                onChange={() => handleToggle("includePhoto")}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Tarjeta: IA y Contenido */}
        <div className="settings-card">
          <h3>IA y Contenido</h3>
          
          <div className="input-group">
            <label>Idioma por Defecto del CV</label>
            <select 
              name="cvLanguage" 
              value={settings.cvLanguage} 
              onChange={handleChange}
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Industria Objetivo</label>
            <input 
              type="text" 
              name="targetIndustry"
              value={settings.targetIndustry} 
              onChange={handleChange}
              placeholder="Ej: IT, Marketing..."
            />
            <p className="hint">Esto optimiza las sugerencias de la IA.</p>
          </div>

          <div className="input-group">
            <label>Estilo / Enfoque</label>
            <select 
              name="cvStyle" 
              value={settings.cvStyle} 
              onChange={handleChange}
            >
              <option value="ats">Compatibilidad ATS</option>
              <option value="balanceado">Balanceado</option>
              <option value="visual">Creativo / Visual</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;