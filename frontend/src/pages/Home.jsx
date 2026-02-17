import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Estilos ---
import "../styles/home.css";

// --- Configuración y Servicios ---
import API_BASE_URL from "../config/api";
import cvService from "../services/cvService";

// Consejos para el "Tip del día"
const JOBLU_TIPS = [
  { text: "Usá verbos de acción como 'Lideré' o 'Desarrollé' en tu experiencia.", target: "experiencia" },
  { text: "Tu resumen profesional debe ser breve y captar la atención en 5 segundos.", target: "perfil" },
  { text: "No olvides incluir links a tu portfolio o perfiles profesionales.", target: "contacto" },
  { text: "Agregá tus habilidades técnicas más importantes para superar filtros ATS.", target: "habilidades" },
  { text: "La educación más reciente siempre debe ir primero.", target: "educacion" }
];

export default function Home({ user }) {
  const navigate = useNavigate();
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [latestPost, setLatestPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCv, setLastCv] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);

  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300; 
      carouselRef.current.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
    }
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
            </div>
            <button onClick={() => navigate(lastCv ? `/cv/${lastCv._id}` : '/cv')} className="hero-cta btn-small">
              {lastCv ? "Editar CV" : "Empezar CV"}
            </button>
          </section>

          {/* 2. Identidad */}
          <section className="stat-card profile-preview-card brand-border">
            <div className="card-content">
              <h3>Tu Identidad</h3>
              <div className="profile-mini-info">
                <p className="profile-name">{cvData.nombre || user.name}</p>
                <p className="profile-job">{cvData.puesto || "Puesto no definido"}</p>
                <p className="profile-location">📍 {cvData.ubicacion || "Ubicación no definida"}</p>
              </div>
            </div>
            <Link to="/cuenta" className="stat-link-secondary">Ajustes de cuenta</Link>
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
                className="hero-cta btn-small secondary-cta"
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
            <div className="card-actions-row">
              <Link to="/comunidad" className="stat-link-secondary">Ver foro</Link>
              <button onClick={() => navigate('/comunidad')} className="btn-icon-plus" title="Crear Post">+</button>
            </div>
          </section>
        </div>

        <section className="dashboard-community-banner">
          <div className="community-banner-content">
            <h2>Explorá nuestra Comunidad</h2>
            <p>Aprendé de otros profesionales y compartí tus propios consejos en <span className="brand-name-comunidad">JOBLU</span>.</p>
            <Link to="/comunidad" className="hero-cta btn-white">Explorar Foro</Link>
          </div>
        </section>

        {/* Carrusel de Empleos */}
        <section className="dashboard-recommendations">
          <div className="section-header">
            <h2>Empleos para vos</h2>
          </div>

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
          
          <Link to="/jobs" className="view-all-btn">Ver todos</Link>
        </section>
      </main>
    );
  }

  {/* VISTA INVITADO CON BANNER Y TEXTO POR ENCIMA */}
  return (
    <main className="home-page">
      <header className="home-hero-banner">
        <div className="hero-banner-image-wrapper">
          <img src="/banner_vacio.jpeg" alt="JOBLU Banner" className="hero-banner-img" />
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
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">2</span>
            <h3>Potenciá tu perfil</h3>
            <p>Nuestra IA integrada en <span className="brand-name">JOBLU</span> analiza tu rubro y sugiere mejoras de redacción.</p>
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">3</span>
            <h3>Impactá en el mercado</h3>
            <p>Descargá un PDF con diseño profesional optimizado para sistemas ATS y destacate.</p>
          </article>
        </div>
      </section>

      <section className="home-sobre">
        <h2 className="home-sobre-titulo">Nuestra Historia</h2>
        <div className="home-sobre-contenido">
          <p>
            Todo comenzó con una hoja en blanco y la frustración de no saber por dónde empezar. Como muchos jóvenes, nos encontramos armando nuestro primer currículum sin experiencia previa y sin nadie que nos enseñara cómo hacerlo. Probamos herramientas genéricas y palabras vacías, dándonos cuenta de que así nunca pasaríamos los filtros ATS que las empresas usan hoy.
          </p>
          <p>
            Investigando, descubrimos que no estábamos solos: miles de adolescentes sentían la misma incertidumbre. Así nació <span className="brand-name">JOBLU</span>. No queríamos ser solo otra herramienta de diseño; queríamos crear el lugar donde realmente <strong>APRENDES</strong> a construir tu identidad profesional.
          </p>
          <p>
            En <span className="brand-name">JOBLU</span>, te damos las herramientas para que armes tu CV según tus necesidades, con consejos personalizados de IA y una comunidad dispuesta a enseñarte. Estamos acá para que dejes de scrollear infinitamente y empieces a encontrar el trabajo que de verdad querés.
          </p>
        </div>
      </section>

      <section className="home-cta-final">
        <h2>Empezá hoy a crear tu futuro profesional</h2>
        <p>Unite a <span className="brand-name">JOBLU</span> y transformá tu forma de buscar trabajo.</p>
        <div className="home-cta-botones">
          <Link to="/cv" className="hero-cta">Crear mi CV</Link>
        </div>
      </section>
    </main>
  );
}