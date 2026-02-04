import "../styles/mycvs.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import cvService from "../services/cvService";

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

function MyCvs({ user }) {
  const navigate = useNavigate();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cvToConfirm, setCvToConfirm] = useState(null);
  const [isImporting, setIsImporting] = useState(false); // Estado para loading de importación

  useEffect(() => {
    if (user) {
      loadCvs();
    } else {
      setLoading(false);
    }
  }, [user]);

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

  const handleDelete = async (id) => {
    // Optimistic update
    const previousCvs = [...cvs];
    setCvs((prev) => prev.filter((cv) => cv._id !== id));
    setCvToConfirm(null);

    try {
      await cvService.delete(id);
    } catch (err) {
      console.error("Error al eliminar CV:", err);
      // Rollback
      setCvs(previousCvs);
      alert("Hubo un error al eliminar el CV.");
    }
  };

  const handleImportClick = () => {
    document.getElementById("import-cv-input").click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const newCv = await cvService.importCv(file);
      // Redirigir al editor con el ID del nuevo CV
      navigate(`/cv/${newCv._id}`);
    } catch (err) {
      console.error(err);
      setError("Error al importar el CV. Intentá con otro archivo.");
      setIsImporting(false);
    }
  };

  if (!user) {
    return (
      <section className="mycvs">
        <h2>Mis CVs</h2>
        <p className="mycvs-subtitle">
          Tenés que iniciar sesión para ver y gestionar tus CVs guardados.
        </p>
        <Link to="/login" className="mycvs-link">
          Iniciar sesión
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mycvs">
        <h2>Mis CVs</h2>
        <p>Cargando...</p>
      </section>
    );
  }

  return (
    <section className="mycvs">
      <h2>Mis CVs</h2>
      <p className="mycvs-subtitle">
        Acá vas a encontrar todos los CVs que guardaste.
      </p>

      {/* Botón de Importar (oculto input) */}
      <div className="mycvs-actions-bar" style={{ marginBottom: "1rem" }}>
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
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            marginRight: "1rem"
          }}
        >
          {isImporting ? "Importando..." : "📤 Importar CV (PDF)"}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {cvs.length === 0 ? (
        <div className="mycvs-empty">
          <p>Todavía no guardaste ningún CV.</p>
          <Link to="/cv" className="mycvs-link">
            Crear mi primer CV →
          </Link>
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
                  onClick={() => {
                    if (cvToConfirm === cv._id) {
                      handleDelete(cv._id);
                    } else {
                      setCvToConfirm(cv._id);
                    }
                  }}
                >
                  {cvToConfirm === cv._id ? "Confirmar eliminación" : "Eliminar"}
                </button>
              </div>

              {cvToConfirm === cv._id && (
                <p className="mycvs-confirm-hint">
                  Volvé a hacer clic para eliminar este CV.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyCvs;
