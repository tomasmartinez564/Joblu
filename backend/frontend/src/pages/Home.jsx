import "../styles/home.css";

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-left">
          <h1 className="hero-title">Creá tu currículum profesional en minutos.</h1>
          <p className="hero-subtitle">
            Con ayuda de inteligencia artificial, diseño moderno y pasos simples para destacar tu perfil laboral.
          </p>

          <a href="/cv" className="hero-cta">
            Crear mi CV ahora
          </a>
        </div>

        <div className="hero-right">
          <img
            src="/hero-illustration.png"
            alt="Ilustración Joblu"
            className="hero-image"
          />
        </div>

        <div className="hero-wave"></div>
      </section>

      <section className="home-suggestions">
        <p className="suggestions-intro">
          Hola <span className="suggestions-user">usuario</span>, tenemos sugerencias nuevas de búsqueda laboral para vos.
        </p>

        <div className="suggestions-carousel">
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
          >
            ‹
          </button>

          <div className="suggestions-cards">
            <article className="suggestion-card">
              <h3 className="suggestion-title">Encargado de cafetería</h3>
              <p className="suggestion-text">
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore."
              </p>
              <button type="button" className="suggestion-cta">
                Ver más
              </button>
            </article>

            <article className="suggestion-card">
              <h3 className="suggestion-title">Supervisor de fábrica</h3>
              <p className="suggestion-text">
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore."
              </p>
              <button type="button" className="suggestion-cta">
                Ver más
              </button>
            </article>
          </div>

          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
          >
            ›
          </button>
        </div>

        <div className="carousel-dots">
          <span className="dot active" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </section>
    </main>
  )
}


export default Home
