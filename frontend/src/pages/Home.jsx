import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Estilos ---
import "../styles/home.css";

// --- Configuración y Servicios ---
import API_BASE_URL from "../config/api";
import cvService from "../services/cvService";

// Consejos para el "Tip del día"
const JOBLU_TIPS = [
  "Usá verbos de acción como 'Lideré', 'Desarrollé' o 'Incrementé' para dar más fuerza a tu experiencia.",
  "Evitá poner 'Referencias a pedido'. Si el reclutador las necesita, te las va a pedir.",
  "Personalizá tu resumen profesional según el rubro al que apuntás.",
  "El diseño ATS-friendly es clave: mantené una estructura simple y clara.",
  "En la sección de habilidades, mezclá tus conocimientos técnicos (Hard Skills) con tus habilidades blandas (Soft Skills)."
];

export default function Home({ user }) {
  const navigate = useNavigate();
  
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [latestPost, setLatestPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCv, setLastCv] = useState(null);
  const [dailyTip, setDailyTip] = useState("");

  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // Seleccionar un consejo aleatorio al cargar
      const randomTip = JOBLU_TIPS[Math.floor(Math.random() * JOBLU_TIPS.length)];
      setDailyTip(randomTip);

      // Cargar CVs
      cvService.getAll()
        .then(cvs => { if (cvs && cvs.length > 0) setLastCv(cvs[0]); })
        .catch(console.error);

      // Cargar Empleos
      fetch(`${API_BASE_URL}/api/jobs`)
        .then(res => res.json())
        .then(data => setRecommendedJobs(data.slice(0, 6)))
        .catch(console.error);

      // Cargar último Post de la comunidad
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
  return (
    <main className="home-dashboard">
      <header className="dashboard-header">
        <h1>¡Hola de nuevo, {user.name.split(" ")[0]}! 👋</h1>
        <p>Tu centro de mando en <span className="brand-name">JOBLU</span>.</p>
      </header>

      {/* Grid 2x2 Directo */}
      <div className="dashboard-grid-layout">
        
        {/* 1. Progreso */}
        <section className="stat-card progress-card">
          <div className="stat-header">
            <h3>Progreso de Perfil</h3>
            <span className="stat-value">{progress}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="stat-hint">
            {progress < 100 ? "Completá tu info para que la IA te ayude mejor." : "¡Perfil optimizado al 100%!"}
          </p>
          <button onClick={() => navigate(lastCv ? `/cv/${lastCv._id}` : '/cv')} className="hero-cta btn-small">
            {lastCv ? "Editar CV" : "Crear CV"}
          </button>
        </section>

        {/* 2. Accesos Rápidos (Opcional) */}
        <section className="stat-card quick-actions">
          <h3>Accesos Rápidos</h3>
          <div className="quick-links">
            <Link to="/mis-cvs" className="quick-link brand-link">📂 Mis Documentos</Link>
            <Link to="/jobs" className="quick-link brand-link">🔍 Buscar Empleos</Link>
            <Link to="/cuenta" className="quick-link brand-link">👤 Ajustes</Link>
          </div>
        </section>

        {/* 3. Tip del día */}
        <section className="stat-card tip-card">
          <div className="tip-content">
            <div className="tip-header">
              <span className="tip-icon">✨</span>
              <h4>Tip <span className="brand-name">JOBLU</span></h4>
            </div>
            <p className="tip-text">"{dailyTip}"</p>
          </div>
        </section>

        {/* 4. Último Post */}
        <section className="stat-card latest-post-card">
          <h3>Comunidad</h3>
          {latestPost ? (
            <div className="post-preview">
              <span className="post-category">{latestPost.category}</span>
              <h4>{latestPost.title}</h4>
              <Link to={`/comunidad/${latestPost._id}`} className="post-link">Ver discusión →</Link>
            </div>
          ) : <p>Cargando novedades...</p>}
        </section>
        
      </div>

        {/* Sección Comunidad Protagónica */}
        <section className="dashboard-community-banner">
          <div className="community-banner-content">
            <h2>Explorá nuestra Comunidad</h2>
            <p>Aprendé de otros profesionales y compartí tus propios consejos en <span className="brand-name">JOBLU</span>.</p>
            <Link to="/comunidad" className="hero-cta btn-white">Explorar Foro</Link>
          </div>
        </section>

        {/* Carrusel de Empleos */}
        <section className="dashboard-recommendations">
          <div className="section-header">
            <h2>Empleos para vos</h2>
            <Link to="/jobs" className="view-all-link">Ver todos</Link>
          </div>
          <div className="jobs-carousel-scroll">
            {loading ? <p>Cargando...</p> : recommendedJobs.map(job => (
              <article key={job._id} className="home-card-trabajo-mini">
                <span className="job-tag">Oportunidad</span>
                <h3>{job.title}</h3>
                <p>{job.company}</p>
                <Link to={`/jobs/${job._id}`} className="card-link-overlay">Ver detalle</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return ( <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-texto">
          <h1>Creá tu currículum profesional con <span className="brand-name">JOBLU</span></h1>
          <p>
            Superá los filtros ATS y destacá tu talento con ayuda de inteligencia artificial y una estructura pensada para el mercado actual.
          </p>
          <Link to="/cv" className="hero-cta">Empezar ahora gratis</Link>
        </div>
        <div className="home-hero-imagen">
          <img src="/hero-illustration.png" alt="JOBLU" />
        </div>
      </section>

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
            <p>Nuestra IA integrada en <span className="brand-name">JOBLU</span> analiza tu rubro y sugiere mejoras de redacción que atraen a los reclutadores.</p>
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">3</span>
            <h3>Impactá en el mercado</h3>
            <p>Descargá un PDF con diseño profesional optimizado para sistemas ATS y destacate en cualquier búsqueda laboral.</p>
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