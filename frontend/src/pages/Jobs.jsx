import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/jobs.css";

import API_BASE_URL from "../config/api";

function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobsData, setJobsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Filtros y UX
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'recent', 'featured'
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]); // Nuevo filtro de tipo
  const [copiedId, setCopiedId] = useState(null); // Feedback al copiar link

  // 1. Fetch de Empleos
  const fetchJobs = async (term = "") => {
    setIsLoading(true);
    try {
      const url = term
        ? `${API_BASE_URL}/api/jobs?search=${encodeURIComponent(term)}`
        : `${API_BASE_URL}/api/jobs`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJobsData(data);
      }
    } catch (error) {
      console.error("Error cargando empleos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(searchTerm);
  };

  // Función auxiliar de tiempo
  const getDaysAgo = (dateString) => {
    if (!dateString) return 0;
    return Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
  };

  const getTimeLabel = (dateString) => {
    const days = getDaysAgo(dateString);
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days}d`;
  };

  // Lógica de Compartir Link
  const handleShare = (id) => {
    const url = `${window.location.origin}/jobs/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Resetear mensaje a los 2s
  };

  // Lógica de mapeo de tipos (API -> Frontend)
  // La API trae "full_time", "contract", etc.
  const formatJobType = (type) => {
    if (!type) return "No especificado";
    const map = {
      "full_time": "Tiempo completo",
      "contract": "Contrato / Freelance",
      "part_time": "Medio tiempo",
      "internship": "Pasantía"
    };
    return map[type] || type.replace("_", " ");
  };

  // FILTRADO PODEROSO 🧠
  const filteredJobs = jobsData.filter(job => {
    // 1. Filtro por Tabs (Pestañas)
    if (activeTab === "recent") {
      if (getDaysAgo(job.publishedAt) > 7) return false;
    }
    // Para 'featured' simulamos u usamos lógica si tuviéramos campo
    if (activeTab === "featured") {
      // Simulamos: mostramos los que tienen tags 'hot' o empresas grandes
      const isBigTech = ["Google", "Amazon", "Microsoft", "Stripe"].some(c => job.company.includes(c));
      const isHot = job.tags && job.tags.includes("Senior");
      if (!isBigTech && !isHot) return false;
    }

    // 2. Filtro por Tags (Categorías)
    if (selectedTags.length > 0) {
      const jobTags = job.tags || [];
      const hasTag = selectedTags.some(tag => jobTags.includes(tag));
      if (!hasTag) return false;
    }

    // 3. Filtro por Tipo de Contrato (Nuevo)
    if (selectedTypes.length > 0) {
      const type = job.type || "";
      // Mapeamos lo que seleccionó el usuario a lo que viene de la API
      // Si seleccionó "Tiempo completo", buscamos "full_time"
      const matchesType = selectedTypes.some(t => {
        if (t === "Tiempo completo") return type === "full_time";
        if (t === "Freelance") return type === "contract" || type === "freelance";
        return false;
      });
      if (!matchesType) return false;
    }

    return true;
  });

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  return (
    <section className="jobs-page">
      <header className="jobs-header">
        <div className="jobs-header-top">
          <div className="jobs-search-area">
            <h1 className="jobs-title">Bolsa de trabajo Tech 🚀</h1>
            <p className="jobs-subtitle">
              Oportunidades remotas y presenciales curadas para vos.
            </p>

            <form className="jobs-search-bar" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="jobs-search-input"
                placeholder="Busca por rol, tecnología o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="jobs-search-button">Buscar</button>
            </form>
          </div>

          {/* TABS RECUPERADOS */}
          <div className="jobs-header-tabs">
            <div className="jobs-list-tabs">
              <button
                className={"jobs-tab" + (activeTab === "all" ? " jobs-tab-active" : "")}
                onClick={() => setActiveTab("all")}
              >
                Todos
              </button>
              <button
                className={"jobs-tab" + (activeTab === "recent" ? " jobs-tab-active" : "")}
                onClick={() => setActiveTab("recent")}
              >
                Recientes 🔥
              </button>
              <button
                className={"jobs-tab" + (activeTab === "featured" ? " jobs-tab-active" : "")}
                onClick={() => setActiveTab("featured")}
              >
                Destacados ⭐
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="jobs-layout">
        <aside className="jobs-filters">

          {/* Filtro Tipo de Empleo (Recuperado y Mapeado) */}
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Tipo de Contrato</summary>
            <div className="jobs-filter-content">
              {["Tiempo completo", "Freelance"].map((type) => (
                <label key={type} className="jobs-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </details>

          {/* Categorías */}
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Tecnologías / Áreas</summary>
            <div className="jobs-filter-chips">
              {["Software Development", "Design", "Marketing", "Sales", "Data", "Product"].map((tag) => (
                <span
                  key={tag}
                  className={"chip" + (selectedTags.includes(tag) ? " chip-active" : "")}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </details>
        </aside>

        <section className="jobs-list-area">
          <div className="jobs-list">

            {/* SKELETON LOADER (Mejora UX) */}
            {isLoading ? (
              <>
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </>
            ) : filteredJobs.length === 0 ? (
              <div className="jobs-empty-state">
                <div style={{ fontSize: "3rem" }}>🔍</div>
                <h3>No encontramos resultados</h3>
                <p>Intenta ajustar los filtros o buscar algo más general.</p>
                <button onClick={() => { setSelectedTags([]); setSearchTerm(""); setActiveTab("all") }} style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isNew = getDaysAgo(job.publishedAt) <= 3;

                return (
                  <article key={job._id} className="job-card">
                    <header className="job-card-header">
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        {job.logo ? (
                          <img
                            src={job.logo}
                            alt={job.company}
                            className="job-card-logo"
                            style={{ width: "48px", height: "48px", objectFit: "contain", borderRadius: "8px", background: "#fff", border: "1px solid #eee" }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="job-card-logo-placeholder">🏢</div>
                        )}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <h2 className="job-card-title">{job.title}</h2>
                            {isNew && <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>NUEVO</span>}
                          </div>
                          <p className="job-card-company">{job.company}</p>
                        </div>
                      </div>
                      <span className="job-card-time">{getTimeLabel(job.publishedAt)}</span>
                    </header>

                    <div className="job-card-tags">
                      {job.tags && job.tags.slice(0, 3).map(t => (
                        <span key={t} className="job-tag-badge">{t}</span>
                      ))}
                    </div>

                    <div className="job-card-meta">
                      📍 {job.location || "Remoto"} &nbsp;•&nbsp; 💼 {formatJobType(job.type)}
                    </div>

                    <div
                      className="job-card-description"
                      style={{ maxHeight: "4.5em", overflow: "hidden", textOverflow: "ellipsis" }}
                      dangerouslySetInnerHTML={{
                        __html: job.description
                          ? job.description.substring(0, 180) + "..."
                          : "Ver detalles..."
                      }}
                    />

                    <div className="job-card-footer">
                      <div className="job-card-footer-left">
                        <Link to={`/jobs/${job._id}`} className="job-card-detail-link">
                          Ver detalles
                        </Link>
                        {/* Botón Compartir Mejorado */}
                        <button
                          className="job-card-icon-btn"
                          onClick={() => handleShare(job._id)}
                          title="Copiar enlace"
                          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "1.2rem" }}
                        >
                          {copiedId === job._id ? "✅" : "🔗"}
                        </button>
                      </div>

                      <Link to={`/jobs/${job._id}`} className="job-card-cta">
                        Ver oferta
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

// Pequeño componente visual para cuando carga
function JobSkeleton() {
  return (
    <div className="job-card" style={{ opacity: 0.7 }}>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ width: 48, height: 48, background: "#e5e7eb", borderRadius: 8 }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ width: "60%", height: 20, background: "#e5e7eb", marginBottom: 8, borderRadius: 4 }}></div>
          <div style={{ width: "40%", height: 16, background: "#e5e7eb", borderRadius: 4 }}></div>
        </div>
      </div>
      <div style={{ width: "100%", height: 60, background: "#f3f4f6", borderRadius: 4 }}></div>
    </div>
  );
}

export default Jobs;