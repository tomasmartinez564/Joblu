import "../styles/settings.css";

function Settings({ user, settings, onChangeSettings }) {
  if (!user) {
    return (
      <section className="settings">
        <h2>Configuración</h2>
        <p className="settings-subtitle">
          Iniciá sesión para personalizar tus preferencias de CV y cuenta.
        </p>
      </section>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Manejo especial para checkboxes
    const newValue = type === "checkbox" ? checked : value;
    onChangeSettings({
      ...settings,
      [name]: newValue,
    });
  };

  return (
    <section className="settings">
      <h2>Configuración</h2>
      <p className="settings-subtitle">
        Personalizá cómo querés que se vea la app y cómo generar tus CVs.
      </p>

      <form className="settings-form">
        {/* Apariencia MOVIDO A CUENTA */}

        {/* Idioma */}
        <div className="settings-group">
          <label className="settings-label">
            Idioma por defecto del CV
            <select
              name="cvLanguage"
              value={settings.cvLanguage}
              onChange={handleChange}
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </label>
          <p className="settings-hint">
            En qué idioma querés que se genere el contenido del CV por
            defecto.
          </p>
        </div>

        {/* Estilo / enfoque */}
        <div className="settings-group">
          <label className="settings-label">
            Estilo / enfoque del CV
            <select
              name="cvStyle"
              value={settings.cvStyle}
              onChange={handleChange}
            >
              <option value="ats">Compatibilidad ATS (filtros automatizados)</option>
              <option value="balanceado">Balanceado (ATS + reclutador)</option>
              <option value="visual">Más visual / creativo</option>
            </select>
          </label>
          <p className="settings-hint">
            Esto se puede usar después para que la IA adapte el contenido y el
            formato según lo que priorices.
          </p>
        </div>

        {/* Rubro / industria */}
        <div className="settings-group">
          <label className="settings-label">
            Rubro / industria objetivo
            <input
              type="text"
              name="targetIndustry"
              value={settings.targetIndustry}
              onChange={handleChange}
              placeholder="Ej: IT, marketing digital, diseño gráfico, atención al cliente..."
            />
          </label>
          <p className="settings-hint">
            Usaremos este dato para que las sugerencias de la IA se adapten al
            sector donde querés trabajar.
          </p>
        </div>

        {/* Foto */}
        <div className="settings-group settings-group-row">
          <label className="settings-checkbox">
            <input
              type="checkbox"
              name="includePhoto"
              checked={settings.includePhoto}
              onChange={handleChange}
            />
            <span>Incluir foto en mis plantillas de CV</span>
          </label>
          <p className="settings-hint">
            Dependiendo del país y el rubro, a veces es mejor con o sin foto.
          </p>
        </div>

        {/* Tips UI */}
        <div className="settings-group settings-group-row">
          <label className="settings-checkbox">
            <input
              type="checkbox"
              name="showTips"
              checked={settings.showTips}
              onChange={handleChange}
            />
            <span>Mostrar tips y recomendaciones dentro del generador</span>
          </label>
          <p className="settings-hint">
            Si te resultan molestos los tips, podés desactivarlos.
          </p>
        </div>
      </form>
    </section>
  );
}

export default Settings;
