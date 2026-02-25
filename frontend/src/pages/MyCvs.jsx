import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Estilos ---
import "../styles/mycvs.css";

// --- Servicios y Datos ---
import cvService from "../services/cvService";
import { useToast } from "../context/ToastContext";
import { getAvailableTemplates } from "../data/templates";
import { ClipLoader } from "react-spinners";

// ==========================================
// 🛠️ UTILIDADES (Helpers)
// ==========================================

/**
 * Formatea una cadena de fecha al estándar local de Argentina.
 */
function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ==========================================
// 📂 COMPONENTE: MIS CVs (MyCvs)
// ==========================================
function MyCvs({ user }) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // --- 1. Estados ---
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cvToConfirm, setCvToConfirm] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  // --- 2. Efectos ---
  useEffect(() => {
    if (user) {
      loadCvs();
    } else {
      setLoading(false);
    }
  }, [user]);

  // --- 3. Lógica de Carga y Acciones ---

  /**
   * Obtiene la lista de CVs desde el servicio.
   */
  const loadCvs = async () => {
    setLoading(true);
    try {
      const data = await cvService.getAll();
      setCvs(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar tus CVs.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestiona la eliminación de un CV con actualización optimista.
   */
  const handleDelete = async (id) => {
    setIsDeleting(id);
    const previousCvs = [...cvs];

    // Actualización optimista: removemos del estado antes de la respuesta del servidor
    setCvs((prev) => prev.filter((cv) => cv._id !== id));
    setCvToConfirm(null);

    try {
      await cvService.delete(id);
      setIsDeleting(null);
    } catch (err) {
      console.error("Error al eliminar CV:", err);
      // Revertimos cambios si falla la petición
      setCvs(previousCvs);
      addToast("Hubo un error al eliminar el CV.", "error");
      setIsDeleting(null);
    }
  };

  /**
   * Maneja la importación de archivos PDF/TXT.
   */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const newCv = await cvService.importCv(file);
      // Redirigir al editor con el nuevo CV generado
      navigate(`/cv/${newCv._id}`);
    } catch (err) {
      console.error(err);
      setError("Error al importar el CV. Intentá con otro archivo.");
      setIsImporting(false);
    }
  };

  const handleImportClick = () => {
    document.getElementById("import-cv-input").click();
  };

  // ==========================================
  // 📦 RENDERIZADO (Vistas condicionales)
  // ==========================================

  // Caso: Usuario no autenticado
  if (!user) {
    return (
      <section className="mycvs">
        <h2>Mis CVs</h2>
        <p className="mycvs-subtitle">
          Tenés que iniciar sesión para ver y gestionar tus CVs guardados.
        </p>
        <Link to="/login" className="mycvs-link">Iniciar sesión</Link>
      </section>
    );
  }

  // Caso: Cargando datos
  if (loading) {
    return (
      <section className="mycvs">
        <h2>Mis CVs</h2>
        <p>Cargando...</p>
      </section>
    );
  }

  // Vista principal
  return (
    <section className="mycvs">
      <header>
        <h2>Mis CVs</h2>
        <p className="mycvs-subtitle">Acá vas a encontrar todos los CVs que guardaste.</p>
      </header>

      {/* Barra de Acciones */}
      <div className="mycvs-actions-bar">
        <input
          type="file"
          id="import-cv-input"
          accept=".pdf,.txt"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="mycvs-import-btn"
          onClick={handleImportClick}
          disabled={isImporting}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {isImporting && <ClipLoader size={16} color="#000" />}
          {isImporting ? "Importando..." : "Importar CV (PDF)"}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {cvs.length === 0 ? (
        <div className="mycvs-empty">
          <p>Todavía no guardaste ningún CV.</p>
          <Link to="/cv" className="mycvs-link">Crear mi primer CV →</Link>
        </div>
      ) : (
        <div className="mycvs-list">
          {cvs.map((cv) => (
            <article key={cv._id} className="mycvs-card">
              <div className="mycvs-card-header">
                <div>
                  <h3 className="mycvs-card-title">{cv.title}</h3>
                  {cv.puesto && <p className="mycvs-card-role">{cv.puesto}</p>}
                  <p className="mycvs-card-date">
                    Última actualización: {formatDate(cv.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="mycvs-card-actions">
                <button
                  type="button"
                  className="mycvs-card-btn primary"
                  onClick={() => navigate(`/cv/${cv._id}`)}
                >
                  Ver / editar
                </button>

                <button
                  type="button"
                  className="mycvs-card-btn danger"
                  disabled={isDeleting === cv._id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => {
                    if (cvToConfirm === cv._id) {
                      handleDelete(cv._id);
                    } else {
                      setCvToConfirm(cv._id);
                    }
                  }}
                >
                  {isDeleting === cv._id && <ClipLoader size={16} color="#fff" />}
                  {cvToConfirm === cv._id ? "Confirmar eliminación" : "Eliminar"}
                </button>
              </div>

              {cvToConfirm === cv._id && (
                <p className="mycvs-confirm-hint">Volvé a hacer clic para eliminar este CV.</p>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── Mis Plantillas ── */}
      <section className="mycvs-templates-section">
        <header className="mycvs-templates-header">
          <h2>Mis Plantillas</h2>
          <p className="mycvs-subtitle">Los diseños disponibles en tu cuenta.</p>
        </header>
        <div className="mycvs-templates-grid">
          {getAvailableTemplates().map((tpl) => (
            <article key={tpl.id} className="mycvs-template-card">
              <div
                className="mycvs-template-thumb"
                style={{ background: `${tpl.color}18` }}
              >
                <span className="mycvs-template-icon">{tpl.thumbnail}</span>
                <span
                  className="mycvs-template-dot"
                  style={{ background: tpl.color }}
                />
              </div>
              <div className="mycvs-template-body">
                <h4>{tpl.name}</h4>
                <p className="mycvs-template-category">{tpl.category}</p>
              </div>
              <button
                className="mycvs-template-btn"
                onClick={() => navigate('/cv', { state: { templateId: tpl.id } })}
              >
                Usar en nuevo CV
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default MyCvs;