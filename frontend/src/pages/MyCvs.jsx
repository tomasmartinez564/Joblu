import "../styles/mycvs.css";
import { useState } from "react";


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

function MyCvs({ user, savedCvs, onOpenCv, onDeleteCv }) {
  const [cvToConfirm, setCvToConfirm] = useState(null);
  if (!user) {
    return (
      <section className="mycvs">
        <h2>Mis CVs</h2>
        <p className="mycvs-subtitle">
          Tenés que iniciar sesión para ver y gestionar tus CVs guardados.
        </p>
      </section>
    );
  }

  return (
    <section className="mycvs">
      <h2>Mis CVs</h2>
      <p className="mycvs-subtitle">
        Acá vas a encontrar todos los CVs que guardaste desde el generador.
      </p>

      {savedCvs.length === 0 ? (
        <div className="mycvs-empty">
          <p>Todavía no guardaste ningún CV.</p>
          <a href="/cv" className="mycvs-link">
            Crear mi primer CV →
          </a>
        </div>
      ) : (
        <div className="mycvs-list">
          {savedCvs.map((cv) => (
            <article key={cv.id} className="mycvs-card">
              <div className="mycvs-card-header">
                <div>
                  <h3 className="mycvs-card-title">{cv.title}</h3>
                  {cv.puesto && (
                    <p className="mycvs-card-role">{cv.puesto}</p>
                  )}
                  <p className="mycvs-card-date">
                    Última actualización: {formatDate(cv.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="mycvs-card-actions">
                <button
                  type="button"
                  className="mycvs-card-btn primary"
                  onClick={() => onOpenCv(cv.id)}
                >
                  Ver / editar
                </button>

                <button
                  type="button"
                  className="mycvs-card-btn danger"
                  onClick={() => {
                    if (cvToConfirm === cv.id) {
                      onDeleteCv(cv.id);
                      setCvToConfirm(null);
                    } else {
                      setCvToConfirm(cv.id);
                    }
                  }}
                >
                  {cvToConfirm === cv.id ? "Confirmar eliminación" : "Eliminar"}
                </button>

              </div>

              {cvToConfirm === cv.id && (
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
