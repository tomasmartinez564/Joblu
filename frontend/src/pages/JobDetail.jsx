// frontend/src/pages/JobDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { JOBS_MOCK } from "../data/jobsMock";
import "../styles/jobs-detail.css";

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const job = JOBS_MOCK.find((item) => item.id === id);

  if (!job) {
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
          No encontramos este empleo. Es posible que haya sido eliminado.
        </p>
      </section>
    );
  }

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
          <div>
            <h1 className="job-detail-title">{job.title}</h1>
            <p className="job-detail-company">{job.company}</p>
          </div>
          <span className="job-detail-time">{job.timeAgo}</span>
        </header>

        <p className="job-detail-meta">
          {job.location} · {job.type} · {job.modality} · {job.level}
        </p>

        <p className="job-detail-description">{job.fullDescription}</p>

        <div className="job-detail-footer">
          <div className="job-detail-footer-left">
            <button
              type="button"
              className="job-card-secondary-btn"
              onClick={() => {
                console.log("Guardar empleo", job.id);
              }}
            >
              Guardar
            </button>
            <button
              type="button"
              className="job-card-secondary-btn"
              onClick={() => {
                console.log("Compartir empleo", job.id);
              }}
            >
              Compartir
            </button>
          </div>

          <button
            type="button"
            className="job-detail-cta"
            onClick={() => {
              console.log("Enviar CV a empleo", job.id);
            }}
          >
            Enviar CV
          </button>
        </div>
      </article>
    </section>
  );
}

export default JobDetail;
