// frontend/src/pages/JobDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/jobs-detail.css";
import API_BASE_URL from "../config/api";

function JobDetail({ savedJobs = [], toggleSavedJob }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Empleo no encontrado");
          throw new Error("Error obteniendo el empleo");
        }
        return res.json();
      })
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <section className="job-detail-page">
        <p>Cargando detalles...</p>
      </section>
    );
  }

  if (error || !job) {
    return (
      <section className="job-detail-page">
        <button
          type="button"
          className="job-detail-back"
          onClick={() => navigate("/jobs")}
        >
          Volver a la bolsa de trabajo
        </button>
        <p className="job-detail-not-found">
          {error || "No encontramos este empleo. Es posible que haya sido eliminado."}
        </p>
      </section>
    );
  }

  const isSaved = savedJobs.includes(job._id);

  return (
    <section className="job-detail-page">
      <button
        type="button"
        className="job-detail-back"
        onClick={() => navigate("/jobs")}
      >
        ← Volver a la bolsa de trabajo
      </button>

      <article className="job-detail-card">
        <header className="job-detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {job.logo && <img src={job.logo} alt={job.company} style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 6 }} />}
            <div>
              <h1 className="job-detail-title">{job.title}</h1>
              <p className="job-detail-company">{job.company}</p>
            </div>
          </div>
          <span className="job-detail-time">{new Date(job.publishedAt).toLocaleDateString()}</span>
        </header>

        <p className="job-detail-meta">
          {job.location} · {job.type && job.type.replace('_', ' ')}
        </p>

        {/* Etiquetas */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0 1rem' }}>
          {(job.tags || []).map(t => (
            <span key={t} style={{ fontSize: '0.85rem', background: '#eee', padding: '4px 8px', borderRadius: 4 }}>{t}</span>
          ))}
        </div>

        {/* Descripción HTML (cuidado con XSS en apps reales, pero Remotive es confiable o usamos sanitizer) */}
        <div
          className="job-detail-description"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />

        <div className="job-detail-footer">
          <div className="job-detail-footer-left">
            <button
              type="button"
              className="job-card-secondary-btn"
              onClick={() => toggleSavedJob && toggleSavedJob(job._id)}
              title={isSaved ? "Quitar de guardados" : "Guardar empleo"}
              style={{ color: isSaved ? "var(--joblu-primary)" : "inherit" }}
            >
              {isSaved ? "❤️ Guardado" : "🤍 Guardar"}
            </button>
          </div>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="job-detail-cta"
          >
            Aplicar en la web oficial
          </a>
        </div>
      </article>
    </section>
  );
}

export default JobDetail;
