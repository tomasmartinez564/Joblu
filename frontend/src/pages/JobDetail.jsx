import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaBuilding, FaMapMarkerAlt, FaBriefcase, FaLightbulb } from "react-icons/fa";

// --- Estilos ---
import "../styles/jobs-detail.css";

// ==========================================
// ⚙️ CONFIGURACIÓN: API URL
// ==========================================
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ==========================================
// 💼 PÁGINA: DETALLE DE EMPLEO (JobDetail)
// ==========================================
function JobDetail() {
  const { id } = useParams();

  // --- 1. Estados ---
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // --- 2. Efectos: Carga de Datos ---
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // --- 3. Manejadores (Handlers) ---
  const handleApply = () => {
    if (!job) return;
    setShowApplyModal(true);
  };

  const confirmApply = () => {
    setShowApplyModal(false);
    if (job.url) {
      window.open(job.url, "_blank");
    } else {
      alert("No hay link de aplicación disponible.");
    }
  };

  // --- 4. Renderizado: Estados de Carga y Error ---
  if (isLoading) return <div className="job-detail-loading" style={{ padding: "2rem", textAlign: "center" }}>Cargando empleo...</div>;
  if (!job) return <div className="job-detail-error" style={{ padding: "2rem", textAlign: "center" }}>Empleo no encontrado.</div>;

  // --- 5. Renderizado: Contenido Principal ---
  return (
    <div className="job-detail-container">
      {/* Navegación de regreso */}
      <div className="job-detail-nav">
        <Link to="/jobs" className="btn-secondary">← Volver a la lista</Link>
      </div>

      {/* Cabecera del Empleo */}
      <header className="job-detail-header">
        <div className="job-header-top">
          {job.logo && <img src={job.logo} alt="logo" className="job-logo" />}
          <h1 className="job-title">{job.title}</h1>
        </div>

        <div className="job-detail-sub">
          <span className="company-name"><FaBuilding className="meta-icon" /> {job.company}</span>
          <span className="location"><FaMapMarkerAlt className="meta-icon" /> {job.location || "Remoto"}</span>
          <span className="type"><FaBriefcase className="meta-icon" /> {job.type ? job.type.replace("_", " ") : "Full time"}</span>
        </div>

        {/* Tags / Habilidades */}
        {job.tags && (
          <div className="job-detail-tags">
            {job.tags.map(t => (
              <span key={t} className="tag-badge">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Acciones: Botón de Postulación */}


      <hr className="divider" style={{ border: '0', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

      {/* Descripción Detallada (Renderizado HTML) */}
      <div
        className="job-detail-content"
        dangerouslySetInnerHTML={{ __html: job.description }}
        style={{ lineHeight: 1.6, color: '#374151' }}
      />

      {/* Acciones: Botón de Postulación (Movido al final) */}
      <div className="job-detail-actions" style={{ margin: '2rem 0', display: 'flex', gap: '1rem' }}>
        <button onClick={handleApply} className="apply-btn-primary" style={{
          background: 'var(--joblu-primary, #6366f1)', color: 'white', border: 'none',
          padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600
        }}>
          Postularme en el sitio de la empresa ↗
        </button>
      </div>

      {/* Modal de Confirmación / Consejo */}
      {showApplyModal && (
        <div className="job-apply-modal-overlay">
          <div className="job-apply-modal">
            <div className="job-apply-modal-icon"><FaLightbulb /></div>
            <h3>¡Consejo <span className="brand-name">JOBLU</span>!</h3>
            <p>
              Asegurate de descargar tu CV en PDF desde la sección <strong>'Crear CV'</strong> antes de continuar con la postulación en el sitio de la empresa.
            </p>
            <div className="job-apply-modal-actions">
              <button className="btn-secondary" onClick={() => setShowApplyModal(false)}>Cancelar</button>
              <button className="apply-btn-primary" onClick={confirmApply} style={{
                background: 'var(--joblu-primary, #6366f1)', color: 'white', border: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600
              }}>
                Continuar al sitio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetail;