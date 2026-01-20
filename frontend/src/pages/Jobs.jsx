// frontend/src/pages/Jobs.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/jobs.css";
import API_BASE_URL from "../config/api";

// function Jobs({ savedJobs, toggleSavedJob }) -> ahora recibe props de App
function Jobs({ savedJobs = [], toggleSavedJob }) {
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | featured | recent | saved
  const [filters, setFilters] = useState({
    types: [],
    modalities: [],
    levels: [],
    locations: [],
    categories: [],
  });

  // 1. Cargar empleos desde el backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobs`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener empleos");
        return res.json();
      })
      .then((data) => {
        setJobsData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los empleos.");
        setLoading(false);
      });
  }, []);

  const handleCheckboxChange = (group) => (event) => {
    const { checked, value } = event.target;
    setFilters((prev) => {
      const current = prev[group];
      return {
        ...prev,
        [group]: checked
          ? [...current, value]
          : current.filter((item) => item !== value),
      };
    });
  };

  const toggleCategory = (category) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  };

  // 2. Filtrado en el cliente (adaptado a los campos reales)
  const filteredJobs = jobsData.filter((job) => {

    // TAB: Saved
    if (activeTab === "saved") {
      if (!savedJobs.includes(job._id)) return false;
    }

    // TAB: Featured
    // Heurística simple: consideramos "Featured" a los que tengan "Senior", "Lead" o "Manager" en el título
    // OJO: Remotive no manda flag "featured". Esto es simulado.
    if (activeTab === "featured") {
      const titleLower = job.title.toLowerCase();
      const isSenior = titleLower.includes("senior") || titleLower.includes("lead") || titleLower.includes("manager") || titleLower.includes("head");
      if (!isSenior) return false;
    }

    // TAB: Recent
    // Consideramos recientes si tienen menos de 7 días (ajustable)
    if (activeTab === "recent") {
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const pub = new Date(job.publishedAt).getTime();
      if (now - pub > weekInMs) return false;
    }

    // Búsqueda por texto (Título o Compañía)
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      const haystack = `${job.title} ${job.company} ${job.description || ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    // Filtros de UI

    // Tipos (full_time, freelance, etc.)
    if (filters.types.length) {
      const jobTypeLower = (job.type || "").toLowerCase();
      const matchesType = filters.types.some(f => {
        if (f === "Tiempo completo") return jobTypeLower.includes("full");
        if (f === "Freelance") return jobTypeLower.includes("freelance") || jobTypeLower.includes("contract");
        if (f === "Pasantía") return jobTypeLower.includes("internship");
        if (f === "Medio tiempo") return jobTypeLower.includes("part");
        return false;
      });
      if (!matchesType) return false;
    }

    // Modalidad (Remoto, Presencial)
    if (filters.modalities.length) {
      const wantRemote = filters.modalities.includes("Remoto");
      const wantOnsite = filters.modalities.includes("Presencial") || filters.modalities.includes("Híbrido");

      // Si solo quiere onsite y es todo remoto
      if (wantOnsite && !wantRemote) return false;
    }

    // Ubicación
    if (filters.locations.length) {
      const locText = (job.location || "").toLowerCase();
      const matchesLocation = filters.locations.some((loc) => {
        return locText.includes(loc.toLowerCase());
      });
      if (!matchesLocation) return false;
    }

    // Categories (Tags en Remotive)
    if (filters.categories.length) {
      if (!job.tags || job.tags.length === 0) return false;
      const jobTagsLower = job.tags.map(t => t.toLowerCase());

      const hasCategory = filters.categories.some((cat) => {
        const catLower = cat.toLowerCase();
        return jobTagsLower.some(tag => tag.includes(catLower));
      });
      if (!hasCategory) return false;
    }

    return true;
  });

  return (
    <section className="jobs-page">
      <header className="jobs-header">
        <div className="jobs-header-top">
          <div className="jobs-search-area">
            <h1 className="jobs-title">Bolsa de trabajo</h1>
            <p className="jobs-subtitle">
              Encontrá ofertas reales y guarda las que más te interesen.
            </p>

            <form
              className="jobs-search-bar"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <input
                type="text"
                className="jobs-search-input"
                placeholder="Cargo, tecnología, empresa..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button type="submit" className="jobs-search-button">
                Buscar
              </button>
            </form>
          </div>

          <div className="jobs-header-tabs">
            <div className="jobs-list-tabs">
              <button
                type="button"
                className={
                  "jobs-tab" + (activeTab === "all" ? " jobs-tab-active" : "")
                }
                onClick={() => setActiveTab("all")}
              >
                Todos
              </button>
              <button
                type="button"
                className={
                  "jobs-tab" + (activeTab === "featured" ? " jobs-tab-active" : "")
                }
                onClick={() => setActiveTab("featured")}
              >
                Destacados
              </button>
              <button
                type="button"
                className={
                  "jobs-tab" + (activeTab === "recent" ? " jobs-tab-active" : "")
                }
                onClick={() => setActiveTab("recent")}
              >
                Recientes
              </button>
              <button
                type="button"
                className={
                  "jobs-tab" + (activeTab === "saved" ? " jobs-tab-active" : "")
                }
                onClick={() => setActiveTab("saved")}
              >
                Guardados ({savedJobs.length})
              </button>
            </div>
          </div>
        </div>
      </header>


      <div className="jobs-layout">
        <aside className="jobs-filters">

          {/* Tipo de empleo */}
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Tipo de empleo</summary>
            <div className="jobs-filter-content">
              <label>
                <input
                  type="checkbox"
                  value="Tiempo completo"
                  onChange={handleCheckboxChange("types")}
                />
                Tiempo completo
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Medio tiempo"
                  onChange={handleCheckboxChange("types")}
                />
                Medio tiempo
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Freelance"
                  onChange={handleCheckboxChange("types")}
                />
                Freelance
              </label>
            </div>
          </details>


          {/* Modalidad */}
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Modalidad</summary>
            <div className="jobs-filter-content">
              <label>
                <input
                  type="checkbox"
                  value="Remoto"
                  onChange={handleCheckboxChange("modalities")}
                />
                Remoto
              </label>
              <label>
                <small style={{ opacity: 0.6 }}>(Estos empleos son mayormente remotos)</small>
              </label>
            </div>
          </details>

          {/* Ubicación */}
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Ubicación</summary>
            <div className="jobs-filter-content">
              {[...new Set(jobsData.map(j => j.location).filter(Boolean))].map(loc => (
                <label key={loc}>
                  <input
                    type="checkbox"
                    value={loc}
                    onChange={handleCheckboxChange("locations")}
                  />
                  {loc}
                </label>
              ))}
            </div>
          </details>

          {/* Categorías (Tags) */}
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Categorías / Tags</summary>
            <div className="jobs-filter-chips">
              {[
                "Software",
                "Design",
                "Marketing",
                "Sales",
                "Product",
                "Data",
                "DevOps",
                "Finance",
                "HR",
                "Writing",
                "All others"
              ].map((cat) => (
                <span
                  key={cat}
                  className={
                    "chip" + (filters.categories.includes(cat) ? " chip-active" : "")
                  }
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </span>
              ))}
            </div>
          </details>
        </aside>


        <section className="jobs-list-area">
          <div className="jobs-list fade-in" key={activeTab}>

            {loading && <p className="jobs-loading">Cargando empleos...</p>}

            {error && <p className="jobs-error">{error}</p>}

            {!loading && !error && filteredJobs.length === 0 && (
              <p className="jobs-empty">
                {activeTab === 'saved'
                  ? "Aún no guardaste ningún empleo."
                  : "No encontramos empleos que coincidan con tu búsqueda."}
              </p>
            )}

            {!loading && !error && filteredJobs.map((job) => {
              const isSaved = savedJobs.includes(job._id);
              return (
                <article key={job._id || job.id} className="job-card">
                  <header className="job-card-header">
                    <div className="job-card-header-main">
                      {job.logo && <img src={job.logo} alt={job.company} className="job-card-logo" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, marginRight: 10 }} />}
                      <div>
                        <h2 className="job-card-title">{job.title}</h2>
                        <p className="job-card-company">{job.company}</p>
                      </div>
                    </div>
                    {/* Fecha de publicación formateada simple */}
                    <span className="job-card-time">
                      {new Date(job.publishedAt).toLocaleDateString()}
                    </span>
                  </header>

                  <p className="job-card-meta">
                    {job.location} · {job.type && job.type.replace('_', ' ')}
                  </p>

                  {/* Etiquetas */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                    {(job.tags || []).slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: '0.75rem', background: '#eee', padding: '2px 6px', borderRadius: 4 }}>{t}</span>
                    ))}
                  </div>

                  <div className="job-card-footer">
                    <div className="job-card-footer-left">
                      <Link
                        to={`/jobs/${job._id}`} // Usamos _id de Mongo si existe, sino id
                        className="job-card-detail-link"
                      >
                        Ver detalles
                      </Link>

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
                      className="job-card-cta"
                    >
                      Aplicar
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

export default Jobs;
