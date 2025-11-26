// frontend/src/pages/Jobs.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/jobs.css";
import { JOBS_MOCK } from "../data/jobsMock";

function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | featured | recent
  const [filters, setFilters] = useState({
    types: [],
    modalities: [],
    levels: [],
    locations: [],
    categories: [],
  });

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

  const filteredJobs = JOBS_MOCK.filter((job) => {
    if (activeTab === "featured" && !job.featured) return false;
    if (activeTab === "recent" && !job.recent) return false;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      const haystack = `${job.title} ${job.company} ${job.shortDescription}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (filters.types.length && !filters.types.includes(job.type)) return false;
    if (
      filters.modalities.length &&
      !filters.modalities.includes(job.modality)
    ) {
      return false;
    }
    if (filters.levels.length && !filters.levels.includes(job.level)) {
      return false;
    }

    if (filters.locations.length) {
      const locText = job.location.toLowerCase();
      const matchesLocation = filters.locations.some((loc) =>
        locText.includes(loc.toLowerCase())
      );
      if (!matchesLocation) return false;
    }

    if (filters.categories.length) {
      const hasCategory = job.categories.some((cat) =>
        filters.categories.includes(cat)
      );
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
              Encontrá ofertas que se ajusten a tu perfil y enviá tu CV creado en Joblu.
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
                placeholder="Cargo, aptitud, empresa..."
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
                Todos los empleos
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
            </div>
          </div>
        </div>
      </header>


      <div className="jobs-layout">
        <aside className="jobs-filters">

        {/* Tipo de empleo */}
        <details className="jobs-filter-section">
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
            <label>
                <input
                type="checkbox"
                value="Pasantía"
                onChange={handleCheckboxChange("types")}
                />
                Pasantía
            </label>
            </div>
        </details>


        {/* Modalidad */}
        <details className="jobs-filter-section">
            <summary className="jobs-filter-title">Modalidad</summary>
            <div className="jobs-filter-content">
            <label>
                <input
                type="checkbox"
                value="Presencial"
                onChange={handleCheckboxChange("modalities")}
                />
                Presencial
            </label>
            <label>
                <input
                type="checkbox"
                value="Híbrido"
                onChange={handleCheckboxChange("modalities")}
                />
                Híbrido
            </label>
            <label>
                <input
                type="checkbox"
                value="Remoto"
                onChange={handleCheckboxChange("modalities")}
                />
                Remoto
            </label>
            </div>
        </details>


        {/* Experiencia */}
        <details className="jobs-filter-section">
            <summary className="jobs-filter-title">Experiencia</summary>
            <div className="jobs-filter-content">
            <label>
                <input
                type="checkbox"
                value="Sin experiencia"
                onChange={handleCheckboxChange("levels")}
                />
                Sin experiencia
            </label>
            <label>
                <input
                type="checkbox"
                value="Junior"
                onChange={handleCheckboxChange("levels")}
                />
                Junior
            </label>
            <label>
                <input
                type="checkbox"
                value="Semi Senior"
                onChange={handleCheckboxChange("levels")}
                />
                Semi Senior
            </label>
            <label>
                <input
                type="checkbox"
                value="Senior"
                onChange={handleCheckboxChange("levels")}
                />
                Senior
            </label>
            </div>
        </details>


        {/* Ubicación */}
        <details className="jobs-filter-section">
            <summary className="jobs-filter-title">Ubicación</summary>
            <div className="jobs-filter-content">
            <label>
                <input
                type="checkbox"
                value="CABA"
                onChange={handleCheckboxChange("locations")}
                />
                CABA
            </label>
            <label>
                <input
                type="checkbox"
                value="GBA"
                onChange={handleCheckboxChange("locations")}
                />
                GBA
            </label>
            <label>
                <input
                type="checkbox"
                value="Interior"
                onChange={handleCheckboxChange("locations")}
                />
                Interior
            </label>
            <label>
                <input
                type="checkbox"
                value="Remoto"
                onChange={handleCheckboxChange("locations")}
                />
                Remoto
            </label>
            </div>
        </details>


        {/* Categorías → chips activables */}
        <details className="jobs-filter-section">
            <summary className="jobs-filter-title">Categorías</summary>
                <div className="jobs-filter-chips">
                {[
                    "Gastronomía",
                    "Tecnología",
                    "Diseño",
                    "Programación",
                    "Textil",
                    "Marketing",
                    "Ingeniería",
                    "Otro",
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
          <div className="jobs-tabs-mobile">
            <div className="jobs-list-tabs">
              <button
                type="button"
                className={
                  "jobs-tab" + (activeTab === "all" ? " jobs-tab-active" : "")
                }
                onClick={() => setActiveTab("all")}
              >
                Todos los empleos
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
            </div>
          </div>

          <div className="jobs-list">
            {filteredJobs.length === 0 && (
              <p className="jobs-empty">
                No encontramos empleos que coincidan con tu búsqueda.
              </p>
            )}

            {filteredJobs.map((job) => (
              <article key={job.id} className="job-card">
                <header className="job-card-header">
                  <div>
                    <h2 className="job-card-title">{job.title}</h2>
                    <p className="job-card-company">{job.company}</p>
                  </div>
                  <span className="job-card-time">{job.timeAgo}</span>
                </header>
                <p className="job-card-meta">
                  {job.location} · {job.type} · {job.modality}
                </p>
                <p className="job-card-description">{job.shortDescription}</p>
                <div className="job-card-footer">
                  <div className="job-card-footer-left">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="job-card-detail-link"
                    >
                      Ver detalles
                    </Link>

                    <button
                      type="button"
                      className="job-card-secondary-btn"
                      onClick={() => {
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="job-card-secondary-btn"
                      onClick={() => {
                      }}
                    >
                      Compartir
                    </button>
                  </div>

                  <button
                    type="button"
                    className="job-card-cta"
                    onClick={() => {
                    }}
                  >
                    Enviar CV
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}


export default Jobs;
