import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaMapMarkerAlt, FaBriefcase, FaLink, FaCheck, FaSearch } from "react-icons/fa";

// --- Estilos ---
import "../styles/jobs.css";

// --- Configuración ---
import API_BASE_URL from "../config/api";

// ==========================================
// 💼 PÁGINA: BOLSA DE TRABAJO (Jobs)
// ==========================================
function Jobs() {
  // --- 1. Estados: Datos y Carga ---
  const [jobsData, setJobsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- 2. Estados: Filtros y Pestañas ---
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'recent', 'featured'
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // --- 3. Estados: Interfaz (UI) ---
  const [copiedId, setCopiedId] = useState(null);

  // --- 4. Efectos: Carga inicial ---
  useEffect(() => {
    fetchJobs();
  }, []);

  // ==========================================
  // 🛠️ UTILIDADES Y FORMATEO
  // ==========================================

  /**
   * Calcula cuántos días pasaron desde una fecha.
   */
  const getDaysAgo = (dateString) => {
    if (!dateString) return 0;
    return Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
  };

  /**
   * Retorna una etiqueta legible de tiempo (Hoy, Ayer, Hace Xd).
   */
  const getTimeLabel = (dateString) => {
    const days = getDaysAgo(dateString);
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    return `Hace ${days}d`;
  };

  /**
   * Mapea los tipos de contrato de la API a nombres legibles.
   */
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

  // ==========================================
  // 📡 LÓGICA DE DATOS Y EVENTOS
  // ==========================================

  /**
   * Realiza la petición de empleos a la API.
   */
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(searchTerm);
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/jobs/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Manejo de Filtros ---
  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // ==========================================
  // 🧠 LÓGICA DE FILTRADO (Frontend)
  // ==========================================
  const filteredJobs = jobsData.filter(job => {
    // 1. Filtro por Pestañas
    if (activeTab === "recent" && getDaysAgo(job.publishedAt) > 7) return false;
    if (activeTab === "featured") {
      const isBigTech = ["Google", "Amazon", "Microsoft", "Stripe"].some(c => job.company.includes(c));
      const isHot = job.tags && job.tags.includes("Senior");
      if (!isBigTech && !isHot) return false;
    }

    // 2. Filtro por Tecnologías
    if (selectedTags.length > 0) {
      const hasTag = selectedTags.some(tag => (job.tags || []).includes(tag));
      if (!hasTag) return false;
    }

    // 3. Filtro por Tipo de Contrato
    if (selectedTypes.length > 0) {
      const type = job.type || "";
      const matchesType = selectedTypes.some(t => {
        if (t === "Tiempo completo") return type === "full_time";
        if (t === "Freelance") return type === "contract" || type === "freelance";
        return false;
      });
      if (!matchesType) return false;
    }

    return true;
  });

  // ==========================================
  // 📦 RENDERIZADO (JSX)
  // ==========================================
  return (
    <section className="jobs-page">
      {/* --- Cabecera y Buscador --- */}
      <header className="jobs-header">
        <div className="jobs-header-top">
          <div className="jobs-search-area">
            <h1 className="jobs-title">Bolsa de trabajo</h1>
            <p className="jobs-subtitle">Oportunidades remotas y presenciales curadas para vos.</p>

            <form className="jobs-search-bar" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="jobs-search-input"
                placeholder="Buscá por rol, tecnología o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="jobs-search-button" aria-label="Buscar"><FaSearch /></button>
            </form>
          </div>

          <div className="jobs-header-tabs">
            <div className="jobs-list-tabs">
              <button className={"jobs-tab" + (activeTab === "all" ? " jobs-tab-active" : "")} onClick={() => setActiveTab("all")}>Todos</button>
              <button className={"jobs-tab" + (activeTab === "recent" ? " jobs-tab-active" : "")} onClick={() => setActiveTab("recent")}>Recientes</button>
              <button className={"jobs-tab" + (activeTab === "featured" ? " jobs-tab-active" : "")} onClick={() => setActiveTab("featured")}>Destacados</button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Layout Principal --- */}
      <div className="jobs-layout">

        {/* Columna: Filtros Laterales */}
        <aside className="jobs-filters">
          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Tipo de Contrato</summary>
            <div className="jobs-filter-content">
              {["Tiempo completo", "Freelance"].map((type) => (
                <label key={type} className="jobs-checkbox-label">
                  <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />
                  {type}
                </label>
              ))}
            </div>
          </details>

          <details className="jobs-filter-section" open>
            <summary className="jobs-filter-title">Tecnologías / Áreas</summary>
            <div className="jobs-filter-chips">
              {["Software Development", "Design", "Marketing", "Sales", "Data", "Product"].map((tag) => (
                <span key={tag} className={"chip" + (selectedTags.includes(tag) ? " chip-active" : "")} onClick={() => toggleTag(tag)}>
                  {tag}
                </span>
              ))}
            </div>
          </details>
        </aside>

        {/* Columna: Lista de Empleos */}
        <section className="jobs-list-area">
          <div className="jobs-list">
            {isLoading ? (
              <><JobSkeleton /><JobSkeleton /><JobSkeleton /></>
            ) : filteredJobs.length === 0 ? (
              <div className="jobs-empty-state">
                <div className="jobs-empty-icon"><FaSearch /></div>
                <h3>No encontramos resultados</h3>
                <p>Intentá ajustar los filtros o buscá algo más general.</p>
                <button onClick={() => { setSelectedTags([]); setSearchTerm(""); setActiveTab("all"); setSelectedTypes([]) }} className="clear-filters-btn">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isNew = getDaysAgo(job.publishedAt) <= 3;
                return (
                  <article key={job._id} className="job-card">
                    <header className="job-card-header">
                      <div className="job-card-header-main">
                        {job.logo ? (
                          <img src={job.logo} alt={job.company} className="job-card-logo" onError={(e) => e.target.style.display = 'none'} />
                        ) : <div className="job-card-logo-placeholder"><FaBuilding /></div>}
                        <div>
                          <div className="job-card-title-container">
                            <h2 className="job-card-title">{job.title}</h2>
                            {isNew && <span className="new-badge">NUEVO</span>}
                          </div>
                          <p className="job-card-company">{job.company}</p>
                        </div>
                      </div>
                      <span className="job-card-time">{getTimeLabel(job.publishedAt)}</span>
                    </header>

                    <div className="job-card-tags">
                      {job.tags?.slice(0, 3).map(t => <span key={t} className="job-tag-badge">{t}</span>)}
                    </div>

                    <div className="job-card-meta"><FaMapMarkerAlt className="meta-icon" /> {job.location || "Remoto"} &nbsp;&bull;&nbsp; <FaBriefcase className="meta-icon" /> {formatJobType(job.type)}</div>

                    <div
                      className="job-card-description"
                      dangerouslySetInnerHTML={{ __html: job.description ? job.description.substring(0, 180) + "..." : "Ver detalles..." }}
                    />

                    <div className="job-card-footer">
                      <div className="job-card-footer-left">
                        <button className="job-card-icon-btn" onClick={() => handleShare(job._id)}>
                          {copiedId === job._id ? <FaCheck /> : <FaLink />}
                        </button>
                      </div>
                      <Link to={`/jobs/${job._id}`} className="job-card-cta">Ver oferta</Link>
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

// --- Subcomponente: Skeleton Loader ---
function JobSkeleton() {
  return (
    <div className="job-card skeleton" style={{ opacity: 0.7 }}>
      <div className="skeleton-header">
        <div className="skeleton-logo"></div>
        <div className="skeleton-text-container">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
      </div>
      <div className="skeleton-body"></div>
    </div>
  );
}

export default Jobs;