import "../styles/home.css";
import { Link } from "react-router-dom";

export default function Home({ user }) {
  return (
    <main className="home-page">
        <section className="home-hero">
          <div className="home-hero-texto">
            <h1>
              Creá tu currículum profesional<br />
              en minutos.
            </h1>

            <p>
              Con ayuda de inteligencia artificial, diseño moderno y pasos simples
              para destacar tu perfil laboral.
            </p>

            <Link to="/cv" className="hero-cta">
              Crear mi CV ahora
            </Link>
          </div>

          <div className="home-hero-imagen">
            <img src="/hero-illustration.png" alt="Persona mostrando CV" />
          </div>
        </section>


      <section className="home-sugerencias">
        <h2 className="home-sugerencias-titulo">
          Hola {user?.name || "____"}, Tenemos sugerencias nuevas de busqueda laboral para vos!
        </h2>

        <div className="home-carrusel">
          <button type="button" className="home-carrusel-flecha" aria-label="Anterior">
            ‹
          </button>

          <div className="home-carrusel-cards">
            <article className="home-card-trabajo">
              <h3>Encargado de Cafeteria</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit, sed do eiusmod tempor
                incididunt ut l...
              </p>
              <Link to="/jobs" className="home-card-boton">
                Ver más
              </Link>
            </article>

            <article className="home-card-trabajo">
              <h3>Supervisor de fabrica</h3>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit, sed do eiusmod tempor
                incididunt ut l...
              </p>
              <Link to="/jobs" className="home-card-boton">
                Ver más
              </Link>
            </article>
          </div>

          <button type="button" className="home-carrusel-flecha" aria-label="Siguiente">
            ›
          </button>
        </div>

        <div className="home-carrusel-dots" aria-label="Paginación">
          <span className="dot" />
          <span className="dot activo" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </section>

      <section className="home-categorias">
      <h2 className="home-categorias-titulo">Explorar por categorías</h2>

      <div className="home-categorias-chips">
        <button type="button" className="categoria-chip">Marketing</button>
        <button type="button" className="categoria-chip">Ventas</button>
        <button type="button" className="categoria-chip">IT</button>
        <button type="button" className="categoria-chip">Administración</button>
        <button type="button" className="categoria-chip">Atención al cliente</button>
      </div>
    </section>

    <section className="home-como-funciona">
  <h2 className="home-como-titulo">¿Cómo funciona Joblu?</h2>

  <div className="home-como-pasos">
    <article className="home-paso">
      <span className="home-paso-numero">1</span>
      <h3>Completá tu perfil</h3>
      <p>
        Ingresá tu información, experiencia, estudios y habilidades en nuestro
        creador de CV.
      </p>
    </article>

    <article className="home-paso">
      <span className="home-paso-numero">2</span>
      <h3>Mejoralo con inteligencia artificial</h3>
      <p>
        Usá nuestro panel de IA para optimizar tu perfil profesional y destacarte
        frente a los reclutadores.
      </p>
    </article>

    <article className="home-paso">
      <span className="home-paso-numero">3</span>
      <h3>Postulate a empleos</h3>
      <p>
        Accedé a ofertas laborales que se ajustan a tu perfil y enviá tu CV en
        segundos.
      </p>
    </article>
  </div>
</section>


    </main>
  );
}

