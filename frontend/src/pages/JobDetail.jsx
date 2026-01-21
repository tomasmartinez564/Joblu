import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/jobs-detail.css"; // Asegúrate de que este archivo exista

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleApply = () => {
    if (!job) return;

    // 1. Feedback / Consejo Joblu
    alert("🚀 ¡Consejo Joblu!\n\nAsegurate de descargar tu CV en PDF desde la sección 'Crear CV' antes de continuar con la postulación en el sitio de la empresa.");

    // 2. Redirección al sitio de la empresa
    if (job.url) {
      window.open(job.url, "_blank");
    } else {
      alert("No hay link de aplicación disponible.");
    }
  };

  if (isLoading) return <div className="job-detail-loading" style={{padding: "2rem", textAlign: "center"}}>Cargando empleo...</div>;
  if (!job) return <div className="job-detail-error" style={{padding: "2rem", textAlign: "center"}}>Empleo no encontrado.</div>;

  return (
    <div className="job-detail-container">
      <div className="job-detail-nav">
         <Link to="/jobs" className="back-link">← Volver a la lista</Link>
      </div>

      <header className="job-detail-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
             {job.logo && <img src={job.logo} alt="logo" style={{width: 60, height: 60, objectFit: 'contain', borderRadius: 8, background: '#fff'}} />}
             <h1 style={{margin: 0, fontSize: '1.8rem'}}>{job.title}</h1>
        </div>

        <div className="job-detail-sub">
          <span className="company-name">🏢 {job.company}</span>
          <span className="location">📍 {job.location || "Remoto"}</span>
          <span className="type">💼 {job.type ? job.type.replace("_", " ") : "Full time"}</span>
        </div>

        {job.tags && (
          <div className="job-detail-tags" style={{marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            {job.tags.map(t => (
                <span key={t} className="tag-badge" style={{background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: 99, fontSize: '0.85rem'}}>
                    {t}
                </span>
            ))}
          </div>
        )}
      </header>

      <div className="job-detail-actions" style={{margin: '2rem 0', display: 'flex', gap: '1rem'}}>
        <button onClick={handleApply} className="apply-btn-primary" style={{
            background: 'var(--joblu-primary, #6366f1)', color: 'white', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600
        }}>
          Postularme en el sitio de la empresa ↗
        </button>
      </div>

      <hr className="divider" style={{border: '0', borderTop: '1px solid #e5e7eb', margin: '2rem 0'}} />

      {/* Renderizado HTML completo */}
      <div
        className="job-detail-content"
        dangerouslySetInnerHTML={{ __html: job.description }}
        style={{lineHeight: 1.6, color: '#374151'}}
      />
    </div>
  );
}

export default JobDetail;