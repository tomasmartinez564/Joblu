import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import TEMPLATES from "../data/templates";

// --- Estilos ---
import "../styles/home.css";

// --- Contexto y Servicios ---
import { useToast } from '../context/ToastContext';
import API_BASE_URL from "../config/api";
import cvService from "../services/cvService";

// Consejos para el "Tip del día"
const JOBLU_TIPS = [
  { text: "Usá verbos de acción como 'Lideré' o 'Desarrollé' en tu experiencia.", target: "experiencias" },
  { text: "Tu resumen profesional debe ser breve y captar la atención en 5 segundos.", target: "perfil" },
  { text: "No olvides incluir links a tu portfolio o perfiles profesionales.", target: "datos" },
  { text: "Agregá tus habilidades técnicas más importantes para superar filtros ATS.", target: "habilidades" },
  { text: "La educación más reciente siempre debe ir primero.", target: "educacion" }
];

export default function Home({ user }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [latestPost, setLatestPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCv, setLastCv] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [openMobileTemplateId, setOpenMobileTemplateId] = useState(null);

  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
    }
  };

  const toggleMobileTemplate = (templateId) => {
    setOpenMobileTemplateId((prev) => (prev === templateId ? null : templateId));
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      setDailyTip(JOBLU_TIPS[Math.floor(Math.random() * JOBLU_TIPS.length)]);

      cvService.getAll().then(cvs => {
        if (cvs && cvs.length > 0) setLastCv(cvs[0]);
      }).catch(console.error);

      fetch(`${API_BASE_URL}/api/jobs`)
        .then(res => res.json())
        .then(data => setRecommendedJobs(data.slice(0, 6)))
        .catch(console.error);

      fetch(`${API_BASE_URL}/api/community/posts`)
        .then(res => res.json())
        .then(data => { if (data.length > 0) setLatestPost(data[0]); })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setOpenMobileTemplateId(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const calculateProgress = (cv) => {
    if (!cv || !cv.data) return 0;
    const data = cv.data;
    let score = 0;
    const fields = ['nombre', 'email', 'telefono', 'ubicacion', 'experiencias', 'educacion', 'habilidades'];
    fields.forEach(f => { if (data[f]) score++; });
    return Math.round((score / fields.length) * 100);
  };

  if (user) {
    const progress = calculateProgress(lastCv);
    const cvData = lastCv?.data || {};

    return (
      <main className="home-dashboard">
        <header className="dashboard-header">
          <h1>¡Hola, {user.name.split(" ")[0]}! 👋</h1>
          <p>Tu centro de mando en <span className="brand-name">JOBLU</span>.</p>
        </header>

        <div className="dashboard-grid-layout">
          {/* 1. Progreso */}
          <section className="stat-card progress-card brand-border">
            <div className="card-content">
              <h3>Estado de tu CV</h3>
              <div className="progress-container-main">
                <span className="stat-value">{progress}%</span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="stat-hint">
                {progress < 100 ? "Seguí completando datos para mejorar tu visibilidad." : "¡Tu perfil está impecable!"}
              </p>
              {progress < 100 && (
                <ul className="progress-checklist">
                  {[
                    { key: 'nombre', label: 'Nombre completo' },
                    { key: 'email', label: 'Email' },
                    { key: 'telefono', label: 'Teléfono' },
                    { key: 'ubicacion', label: 'Ubicación' },
                    { key: 'experiencias', label: 'Experiencia laboral' },
                    { key: 'educacion', label: 'Educación' },
                    { key: 'habilidades', label: 'Habilidades' },
                  ].map(item => (
                    <li key={item.key} className={cvData[item.key] ? 'checklist-done' : 'checklist-pending'}>
                      <span className="checklist-icon">{cvData[item.key] ? '✓' : '○'}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={() => navigate(lastCv ? `/cv/${lastCv._id}` : '/cv')} className="hero-cta">
              {lastCv ? "Editar CV" : "Empezar CV"}
            </button>
          </section>

          {/* 2. Plantillas — grilla estática 3 columnas */}
          <section className="stat-card templates-mini-card brand-border">
            <div className="card-content">
              <div className="templates-card-header">
                <h3>Plantillas</h3>
                <Link to="/mis-cvs" className="templates-card-ver-todas">Mis plantillas →</Link>
              </div>
              <div className="templates-static-grid">
                {TEMPLATES.map((tpl) => {
                  const isActive = lastCv?.templateId === tpl.id;
                  const canUse = tpl.type === 'free' || tpl.isAcquired;

                  return (
                    <button
                      key={tpl.id}
                      className={`templates-static-item${isActive ? " templates-static-item--active" : ""}${!canUse ? " locked" : ""}`}
                      onClick={() => {
                        if (canUse) {
                          navigate('/cv', { state: { templateId: tpl.id } });
                        } else {
                          addToast(`¡Próximamente! Desbloqueá "${tpl.name}" para usarla en tu CV.`, 'info');
                        }
                      }}
                      title={tpl.description}
                    >
                      {isActive && <span className="templates-mini-badge">Actual</span>}
                      <span
                        className="templates-static-thumb"
                        style={{ background: `${tpl.color}18` }}
                      >
                        <span className="templates-static-icon">{tpl.thumbnail}</span>
                        <span className="templates-mini-dot" style={{ background: tpl.color }} />
                      </span>
                      <span className="templates-static-name">{tpl.name}</span>
                      {canUse ? (
                        <span className="templates-mini-use">Usar →</span>
                      ) : (
                        <span className="templates-mini-use locked-text"><FaLock style={{ marginRight: '4px' }} /> Bloqueado</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. Tip */}
          <section className="stat-card tip-card brand-border">
            <div className="card-content">
              <div className="tip-header">
                <span className="tip-icon">✨</span>
                <h4>Tip <span className="brand-name">JOBLU</span></h4>
              </div>
              <p className="tip-text">"{dailyTip?.text}"</p>
            </div>
            {lastCv && (
              <button
                onClick={() => navigate(`/cv/${lastCv._id}#${dailyTip?.target}`)}
                className="btn-secondary"
              >
                Mejorar esta sección
              </button>
            )}
          </section>

          {/* 4. Comunidad */}
          <section className="stat-card latest-post-card brand-border">
            <div className="card-content">
              <h3>Comunidad</h3>
              {latestPost ? (
                <div className="post-preview-home">
                  <span className="post-tag-mini">{latestPost.category}</span>
                  <h4>{latestPost.title}</h4>
                </div>
              ) : <p className="empty-msg">Explorá dudas de otros usuarios.</p>}
            </div>
            <Link to="/comunidad" className="btn-secondary">Ver foro</Link>
          </section>
        </div>

        <section className="unified-dashboard-section">
          {/* Encabezado unificado: introduce tanto la comunidad como los empleos */}
          <div className="unified-section-header">
            <h2>Oportunidades y Comunidad</h2>
            <p>Empleos recomendados para vos, más los últimos aportes de la comunidad <span className="brand-name-comunidad">JOBLU</span>.</p>
          </div>

          {/* Carrusel de Empleos */}
          <div className="dashboard-recommendations">
            {/* Controles del Carrusel */}
            <div className="carousel-controls">
              <button onClick={() => scrollCarousel(-1)} className="carousel-arrow" aria-label="Anterior">‹</button>
              <button onClick={() => scrollCarousel(1)} className="carousel-arrow" aria-label="Siguiente">›</button>
            </div>

            <div className="jobs-carousel-container">
              <div className="jobs-carousel-scroll" ref={carouselRef}>
                {loading ? <p>Cargando...</p> : recommendedJobs.map(job => (
                  <article key={job._id} className="home-card-trabajo-mini">
                    <span className="job-tag">Oportunidad</span>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                    <Link to={`/jobs/${job._id}`} className="card-link-overlay">Ver detalle</Link>
                  </article>
                ))}
              </div>
            </div>

            <Link to="/jobs" className="view-all-btn">Ver todos los empleos</Link>
          </div>
        </section>

        {/* --- Tienda de Plantillas --- */}
        <section className="home-templates-section">
          <div className="home-templates-header">
            <h2>Explorá nuevos diseños</h2>
            <p>3 plantillas gratuitas disponibles. Desbloqué las exclusivas para destacarte.</p>
          </div>
          <div className="home-templates-grid">
            {TEMPLATES.map((tpl) => {
              const isActual = lastCv?.templateId === tpl.id;
              const canUse = tpl.type === 'free' || tpl.isAcquired;

              const handleTemplateAction = () => {
                if (canUse) {
                  navigate('/cv', { state: { templateId: tpl.id } });
                } else {
                  addToast(`¡Próximamente! Desbloqueá "${tpl.name}" para usarla en tu CV.`, 'info');
                }
              };

              return (
                <article
                  key={tpl.id}
                  className={`home-template-card${tpl.type === 'exclusive' ? ' home-template-card--exclusive' : ''}${openMobileTemplateId === tpl.id ? ' is-open' : ''}`}
                >
                  {/* Header visible siempre (mobile: funciona como accordion button) */}
                  <button
                    type="button"
                    className="home-template-mobile-toggle"
                    onClick={() => toggleMobileTemplate(tpl.id)}
                    aria-expanded={openMobileTemplateId === tpl.id}
                    aria-controls={`tpl-panel-${tpl.id}`}
                  >
                    <div className="home-template-card-thumb" style={{ background: `${tpl.color}18` }}>
                      <span className="home-template-card-icon">{tpl.thumbnail}</span>
                      <span className="home-template-dot" style={{ background: tpl.color }} />
                      {tpl.type === 'exclusive' && !tpl.isAcquired && (
                        <span className="badge-exclusive">🔒 Exclusiva</span>
                      )}
                      {tpl.isAcquired && tpl.type === 'exclusive' && (
                        <span className="badge-acquired">✔ Adquirida</span>
                      )}
                      {isActual && (
                        <span className="badge-actual">Actual</span>
                      )}
                    </div>

                    <div className="home-template-mobile-summary">
                      <div className="home-template-mobile-summary-text">
                        <h4>{tpl.name}</h4>
                        <p className="home-template-category">{tpl.category}</p>
                      </div>

                      {/* Chevron solo visual en mobile */}
                      <span
                        className={`home-template-mobile-chevron ${openMobileTemplateId === tpl.id ? 'is-rotated' : ''}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {/* Panel colapsable (mobile) / visible normal (desktop por CSS) */}
                  <div
                    id={`tpl-panel-${tpl.id}`}
                    className={`home-template-collapsible ${openMobileTemplateId === tpl.id ? 'is-open' : ''}`}
                  >
                    <div className="home-template-collapsible-inner">
                      <div className="home-template-card-body">
                        <p className="home-template-description">{tpl.description}</p>

                        <div className="home-template-features">
                          {tpl.features.map((f) => (
                            <span key={f} className="home-template-tag">{f}</span>
                          ))}
                        </div>
                      </div>

                      <button
                        className={`home-template-cta${isActual ? ' home-template-cta--inuse'
                          : !canUse ? ' home-template-cta--unlock'
                            : ''
                          }`}
                        onClick={handleTemplateAction}
                        disabled={isActual}
                      >
                        {isActual ? 'En uso' : canUse ? 'Usar plantilla' : '🔒 Desbloquear'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  {/* VISTA INVITADO CON BANNER Y TEXTO POR ENCIMA */ }
  return (
    <main className="home-page">
      <header className="home-hero-banner">
        <div className="hero-banner-image-wrapper">
          <picture>
            <source media="(max-width: 767px)" srcSet="/banner_movil.jpeg" />
            <img src="/banner_vacio.jpeg" alt="JOBLU Banner" className="hero-banner-img" />
          </picture>
          <div className="hero-banner-overlay">
            <div className="hero-banner-content">
              <h1>Creá tu currículum profesional con <span className="brand-name">JOBLU</span></h1>
              <p>
                Superá los filtros ATS y destacá tu talento con ayuda de inteligencia artificial y una estructura pensada para el mercado actual.
              </p>
              <Link to="/cv" className="hero-cta">Empezar ahora gratis</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="home-como-funciona">
        <h2 className="home-como-titulo">¿Cómo funciona <span className="brand-name">JOBLU</span>?</h2>
        <div className="home-como-pasos">
          <article className="home-paso">
            <span className="home-paso-numero">1</span>
            <h3>Volcá tu talento</h3>
            <p>Nuestro formulario inteligente te guía paso a paso para que no olvides ningún detalle clave que buscan las empresas.</p>
            <span className="paso-beneficio">Completá tu perfil en minutos.</span>
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">2</span>
            <h3>Potenciá tu perfil</h3>
            <p>Nuestra IA integrada en <span className="brand-name">JOBLU</span> analiza tu rubro y sugiere mejoras de redacción.</p>
            <span className="paso-beneficio">Recibí mejoras con IA para destacar.</span>
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">3</span>
            <h3>Impactá en el mercado</h3>
            <p>Descargá un PDF con diseño profesional optimizado para sistemas ATS y destacate.</p>
            <span className="paso-beneficio">Descargá un CV listo para postular.</span>
          </article>
        </div>
      </section>

      <div className="section-divider-accent" aria-hidden="true" />

      <section className="home-sobre">
        <div className="home-sobre-header">
          <span className="home-sobre-eyebrow">NUESTRA MISIÓN</span>
          <h2 className="home-sobre-titulo">Nuestra Historia</h2>
        </div>
        <div className="home-sobre-contenido">
          <div className="historia-bloque">
            <h4 className="historia-subtitulo">El origen</h4>
            <p>
              Todo comenzó con <span className="highlight">una hoja en blanco</span> y la frustración de no saber por dónde empezar. Como muchos jóvenes, nos encontramos armando nuestro primer currículum sin experiencia previa y sin nadie que nos enseñara cómo hacerlo. Probamos herramientas genéricas y palabras vacías, dándonos cuenta de que así nunca pasaríamos los filtros ATS que las empresas usan hoy.
            </p>
          </div>
          <div className="historia-bloque">
            <h4 className="historia-subtitulo">El hallazgo</h4>
            <p>
              Investigando, descubrimos que <span className="highlight">no estábamos solos</span>: miles de adolescentes sentían la misma incertidumbre. Así nació <span className="brand-name">JOBLU</span>. No queríamos ser solo otra herramienta de diseño; queríamos crear el lugar donde realmente <strong>APRENDÉS</strong> a construir tu identidad profesional.
            </p>
          </div>
          <div className="historia-bloque">
            <h4 className="historia-subtitulo">La solución</h4>
            <p>
              En <span className="brand-name">JOBLU</span>, te damos las herramientas para que armes tu CV según tus necesidades, con consejos personalizados de IA y una comunidad dispuesta a enseñarte. Estamos acá para que dejes de scrollear infinitamente y empieces a <span className="highlight">encontrar el trabajo que de verdad querés</span>.
            </p>
          </div>

          <blockquote className="historia-callout">
            Por eso existe <span className="brand-name">JOBLU</span>: para que el talento no se pierda entre filtros, uniendo IA, comunidad y diseño profesional.
          </blockquote>
        </div>
      </section>

      <section className="home-cta-final">
        <h2>Empezá hoy a construir tu futuro profesional</h2>
        <p>Unite a la plataforma que combina identidad, inteligencia artificial y comunidad en un solo lugar.</p>

        <ul className="cta-benefits-row">
          <li>✦ CV optimizado para postular</li>
          <li>✦ Mejora con IA integrada</li>
          <li>✦ Comunidad con consejos reales</li>
        </ul>

        <div className="home-cta-botones">
          <Link to="/cv" className="hero-cta">Crear mi CV</Link>
          <Link to="/comunidad" className="btn-link-secondary">Explorar comunidad →</Link>
        </div>
      </section>
    </main>
  );
}