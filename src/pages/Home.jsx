import "../styles/home.css";

function Home() {
  return (
    <section className="home-hero">
      <h1 className="home-title">Genera tu CV en minutos</h1>
      <p className="home-subtitle">
        Completá un formulario sencillo, mirá la vista previa en tiempo real y descargá tu CV en PDF.
        Además, compartí experiencias y tips en la comunidad.
      </p>

      <div className="home-grid">
        <div className="home-card">
          <h3>Enfoque simple</h3>
          <p>
            Paso a paso: datos personales, experiencia, educación, habilidades y más.
          </p>
        </div>
        <div className="home-card">
          <h3>Vista previa en vivo</h3>
          <p>
            Mientras escribís, tu CV se arma con un diseño limpio y profesional.
          </p>
        </div>
        <div className="home-card">
          <h3>Exportar a PDF</h3>
          <p>
            Descargá tu CV listo para postular a trabajos o compartir por mail.
          </p>
        </div>
        <div className="home-card">
          <h3>Comunidad</h3>
          <p>
            Mira posteos de otros usuarios y compartí tus dudas o consejos.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Home
