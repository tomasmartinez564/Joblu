import "../styles/mycvs.css";
import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

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

function MyCvs({ user, onOpenCv }) {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cvToConfirm, setCvToConfirm] = useState(null);

  useEffect(() => {
    if (user?.email) {
      fetchCvs();
    } else {
      setCvs([]);
    }
  }, [user]);

  const fetchCvs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/cvs?email=${user.email}`);
      if (!res.ok) throw new Error("Error al obtener CVs");
      const data = await res.json();
      setCvs(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar tus CVs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");

      // Actualizar lista local
      setCvs((prev) => prev.filter((c) => c._id !== id));
      setCvToConfirm(null);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al eliminar el CV.");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (ej. 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("El archivo es muy pesado. Máximo 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;

      const payload = {
        userEmail: user.email,
        type: "uploaded",
        fileData: base64,
        fileName: file.name,
        contentType: file.type,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/cvs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          if (res.status === 413) throw new Error("El archivo es demasiado grande para el servidor.");
          throw new Error("Error al subir archivo");
        }

        const savedCv = await res.json();
        setCvs((prev) => [savedCv, ...prev]);
        alert("CV subido correctamente.");
      } catch (err) {
        console.error(err);
        alert(err.message || "Error al subir el CV.");
      }
    };
    reader.onerror = () => {
      alert("Error al leer el archivo.");
    }
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = null;
  };

  const handleDownloadUploaded = (cv) => {
    // Crear un link temporal y simular click
    const link = document.createElement("a");
    link.href = cv.fileData;
    link.download = cv.fileName || "cv_descargado.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="mycvs-header-row">
        <h2>Mis CVs</h2>

        <label className="mycvs-upload-btn">
          <span>☁️ Subir PDF</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            className="mycvs-file-input"
          />
        </label>
      </div>

      <p className="mycvs-subtitle">
        Acá vas a encontrar todos los CVs que guardaste desde el generador o que subiste.
      </p>

      {loading && <p>Cargando tus CVs...</p>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && !error && cvs.length === 0 ? (
        <div className="mycvs-empty">
          <p>Todavía no guardaste ningún CV.</p>
          <a href="/cv" className="mycvs-link">
            Crear mi primer CV →
          </a>
        </div>
      ) : (
        <div className="mycvs-list">
          {cvs.map((cv) => (
            <article key={cv._id} className="mycvs-card">
              <div className="mycvs-card-header">
                <div>
                  <div className="mycvs-card-badges">
                    {cv.type === "uploaded" && <span className="badge-uploaded">SUBIDO</span>}
                  </div>
                  {/* cv.title viene del root, o data.nombre */}
                  <h3 className="mycvs-card-title">{cv.title || "CV sin título"}</h3>
                  {cv.puesto && (
                    <p className="mycvs-card-role">{cv.puesto}</p>
                  )}
                  <p className="mycvs-card-date">
                    Última actualización: {formatDate(cv.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="mycvs-card-actions">

                {cv.type === "uploaded" ? (
                  <button
                    type="button"
                    className="mycvs-card-btn primary"
                    onClick={() => handleDownloadUploaded(cv)}
                  >
                    Descargar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mycvs-card-btn primary"
                    onClick={() => {
                      // Al abrir, pasamos todo el objeto CV (que incluye la data en cv.data)
                      // Pero CvBuilder espera la estructura de "data".
                      // El backend guardó: { _id, title, data: { ...contenido... } }
                      // Así que pasamos cv.data mezclado con el _id para que CvBuilder sepa cuál es.
                      const cvDataConId = { ...cv.data, _id: cv._id };
                      onOpenCv(cvDataConId);
                    }}
                  >
                    Ver / editar
                  </button>
                )}

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
