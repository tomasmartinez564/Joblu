import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Estilos ---
import "../styles/home.css";

// --- Configuración y Servicios ---
import API_BASE_URL from "../config/api";
import cvService from "../services/cvService";

// ==========================================
// 🏠 PÁGINA: HOME (Dashboard / Landing)
// ==========================================
export default function Home({ user }) {
  const navigate = useNavigate();
  
  // --- Estados ---
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [lastCv, setLastCv] = useState(null);

  // --- Efectos: Carga de datos para usuarios registrados ---
  useEffect(() => {
    if (user) {
      setLoadingJobs(true);

      // Cargar el último CV del usuario
      cvService.getAll()
        .then(cvs => {
          if (cvs && cvs.length > 0) {
            setLastCv(cvs[0]);
          }
        })
        .catch(console.error);

      // Cargar empleos recomendados
      fetch(`${API_BASE_URL}/api/jobs`)
        .then(res => res.json())
        .then(data => {
          setRecommendedJobs(data.slice(0, 3));
        })
        .catch(err => console.error("Error fetching jobs:", err))
        .finally(() => setLoadingJobs(false));
    }
  }, [user]);

  // ==========================================
  // 🧠 LÓGICA INTERNA: DASHBOARD
  // ==========================================
  
  /**
   * Calcula el porcentaje de completitud del CV basado en campos obligatorios.
   */
  const calculateProgress = (cv) => {
    if (!cv || !cv.data) return 0;
    const data = cv.data;
    let score = 0;
    const totalPoints = 7; // 4 campos personales + 3 secciones clave

    // Validación de datos personales
    if (data.nombre && data.nombre.length > 2) score++;
    if (data.email && data.email.includes("@")) score++;
    if (data.telefono && data.telefono.length > 5) score++;
    if (data.ubicacion && data.ubicacion.length > 2) score++;

    // Validación de secciones de contenido
    if (data.experiencias && data.experiencias.length > 0) score++;
    if (data.educacion && data.educacion.length > 0) score++;
    if (data.habilidades && data.habilidades.length > 0) score++;

    return Math.round((score / totalPoints) * 100);
  };

  // --- Renderizado: Dashboard (Usuario Logueado) ---
  if (user) {
    const progress = calculateProgress(lastCv);

    return (
      <main className="home-dashboard">
        {/* Cabecera de Bienvenida */}
        <header className="dashboard-header">
          <h1>Hola, {user.name ? user.name.split(" ")[0] : "Usuario"} 👋</h1>
          <p>
            {lastCv
              ? "Seguí mejorando tu perfil para destacar."
              : "Empecemos a crear tu primer CV profesional."}
          </p>
        </header>

        {/* Estadísticas y Progreso */}
        <section className="dashboard-stats">
          <div className="stat-card progress-card">
            <div className="stat-header">
              <h3>Estado del CV</h3>
              <span className="stat-value">{progress}%</span>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="stat-hint">
              {progress === 100
                ? "¡Tu perfil está completo! Listo para exportar."
                : progress > 50
                  ? "¡Vas muy bien! Agregá skills o experiencia para completar."
                  : "Completá tus datos personales y experiencia para arrancar."}
            </p>

            {lastCv ? (
              <button onClick={() => navigate(`/cv/${lastCv._id}`)} className="stat-action-btn">
                Continuar editando →
              </button>
            ) : (
              <Link to="/cv" className="stat-action">Crear CV →</Link>
            )}
          </div>

          <div className="stat-card quick-actions">
            <h3>Accesos Rápidos</h3>
            <div className="quick-links">
              <Link to="/mis-cvs" className="quick-link">📂 Mis CVs</Link>
              <Link to="/comunidad" className="quick-link">💬 Comunidad</Link>
              <Link to="/jobs" className="quick-link">💼 Buscar Empleo</Link>
            </div>
          </div>
        </section>

        {/* Recomendaciones Personalizadas */}
        <section className="dashboard-recommendations">
          <h2>Recomendado para vos</h2>
          <div className="home-carrusel-cards">
            {loadingJobs ? (
              <p>Cargando empleos...</p>
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map(job => (
                <article key={job._id} className="home-card-trabajo">
                  <h3>{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                  <Link to={`/jobs/${job._id}`} className="home-card-boton">Ver empleo</Link>
                </article>
              ))
            ) : (
              <p>No hay recomendaciones por ahora.</p>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ==========================================
  // 🌟 RENDERIZADO: LANDING (Usuario Invitado)
  // ==========================================
  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-texto">
          <h1>Creá tu currículum profesional<br />en minutos.</h1>
          <p>
            Con ayuda de inteligencia artificial, diseño moderno y pasos simples
            para destacar tu perfil laboral.
          </p>
          <Link to="/cv" className="hero-cta">Crear mi CV ahora</Link>
        </div>
        <div className="home-hero-imagen">
          <img src="/hero-illustration.png" alt="Persona mostrando CV" />
        </div>
      </section>

      {/* Sugerencias de Empleo (Carrusel estático) */}
      <section className="home-sugerencias">
        <h2 className="home-sugerencias-titulo">Encuentra el trabajo ideal para vos</h2>
        <div className="home-carrusel">
          <button type="button" className="home-carrusel-flecha">‹</button>
          <div className="home-carrusel-cards">
            <article className="home-card-trabajo">
              <h3>Encargado de Cafetería</h3>
              <p>Lorem ipsum dolor sit amet...</p>
              <Link to="/jobs" className="home-card-boton">Ver más</Link>
            </article>
            <article className="home-card-trabajo">
              <h3>Supervisor de fábrica</h3>
              <p>Lorem ipsum dolor sit amet...</p>
              <Link to="/jobs" className="home-card-boton">Ver más</Link>
            </article>
          </div>
          <button type="button" className="home-carrusel-flecha">›</button>
        </div>
        <div className="home-carrusel-dots">
          {[1, 2, 3, 4].map((_, i) => (
            <span key={i} className={`dot ${i === 1 ? 'activo' : ''}`} />
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section className="home-categorias">
        <h2 className="home-categorias-titulo">Explorar por categorías</h2>
        <div className="home-categorias-chips">
          {["Marketing", "Ventas", "IT", "Administración", "Atención al cliente"].map(cat => (
            <button key={cat} type="button" className="categoria-chip">{cat}</button>
          ))}
        </div>
      </section>

      {/* Pasos de funcionamiento */}
      <section className="home-como-funciona">
        <h2 className="home-como-titulo">¿Cómo funciona Joblu?</h2>
        <div className="home-como-pasos">
          <article className="home-paso">
            <span className="home-paso-numero">1</span>
            <h3>Completá tu perfil</h3>
            <p>Ingresá tu información, experiencia, estudios y habilidades.</p>
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">2</span>
            <h3>Mejoralo con IA</h3>
            <p>Usá nuestro panel de IA para optimizar tu perfil profesional.</p>
          </article>
          <article className="home-paso">
            <span className="home-paso-numero">3</span>
            <h3>Postulate a empleos</h3>
            <p>Accedé a ofertas laborales y enviá tu CV en segundos.</p>
          </article>
        </div>
      </section>

      {/* Sobre el proyecto */}
      <section className="home-sobre">
        <h2 className="home-sobre-titulo">Sobre Joblu</h2>
        <div className="home-sobre-contenido">
          <p>Joblu nació como un proyecto educativo para ayudar a personas a crear currículums profesionales de forma simple y moderna.</p>
          <p>Combinamos diseño, inteligencia artificial y búsqueda laboral en un solo lugar.</p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="home-cta-final">
        <h2>Empezá hoy a crear tu CV profesional</h2>
        <p>Es simple, rápido y potenciado con inteligencia artificial.</p>
        <div className="home-cta-botones">
          <Link to="/cv" className="hero-cta">Crear mi CV</Link>
          <Link to="/jobs" className="home-cta-secundario">Ver empleos</Link>
        </div>
      </section>
    </main>
  );
}