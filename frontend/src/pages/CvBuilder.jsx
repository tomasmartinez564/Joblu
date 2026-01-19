import { useState, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import "../styles/cvbuilder.css";
import Settings from "./Settings";



// 👇 Base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Estado base vacío de un CV
const emptyCv = {
  // Datos personales
  nombre: "",
  puesto: "",
  email: "",
  telefono: "",
  ubicacion: "",
  sitioWeb: "",
  linkedin: "",
  github: "",

  // Contenido del CV
  perfil: "",
  experiencias: "",
  educacion: "",
  habilidades: "",
  idiomas: "",
  proyectos: "",
  otros: "",

  // Foto en base64
  foto: "",
};

function CvBuilder({ onSaveCv, initialData, user, settings, onChangeSettings }) {
  const isLogged = !!user;

  // Preferencias del usuario (con defaults por si no vienen)
  const {
    cvLanguage = "es",
    cvStyle = "ats",
    includePhoto = true,
    showTips = true,
    targetIndustry = "",
  } = settings || {};

  const [cvData, setCvData] = useState(initialData || emptyCv);

  const [showSettings, setShowSettings] = useState(false);

  const [sectionsVisible, setSectionsVisible] = useState({
    perfil: true,
    experiencias: true,
    educacion: true,
    habilidades: true,
    idiomas: false,
    proyectos: true,
    otros: true,
  });

  const cvRef = useRef(null);

  
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSection, setAiSection] = useState("perfil");
  const [jobDesc, setJobDesc] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Tutorial guiado (onboarding)
  const [tutorialActivo, setTutorialActivo] = useState(false);
  const [pasoTutorial, setPasoTutorial] = useState(0);

  const refBtnConfiguracion = useRef(null);
  const refTextareaPerfil = useRef(null);
  const refBtnIA = useRef(null);
  const refVistaPrevia = useRef(null);
  const refTutorialModal = useRef(null);




  // Cuando cambia el CV activo (desde "Mis CVs"), actualizamos el formulario
  useEffect(() => {
    if (initialData) {
      setCvData(initialData);
    } else {
      setCvData(emptyCv);
    }
  }, [initialData]);

  useEffect(() => {
    if (!showTips) return;

  const yaVioTutorial = localStorage.getItem("joblu_tutorial_cv_v1");
    if (yaVioTutorial) return;

  setTutorialActivo(true);
  setPasoTutorial(0);
  }, [showTips]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setCvData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadPDF = () => {
    if (!cvRef.current) return;

    const element = cvRef.current;
    const opt = {
      margin: 0,
      filename: `${cvData.nombre || "mi_cv"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const toggleSection = (key) => {
    setSectionsVisible((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    
    setSaveError("");
    setSaveSuccess("");

    if (!isLogged) {
      setSaveError(
        cvLanguage === "en"
          ? "You need to log in to save your CVs."
          : "Tenés que iniciar sesión para guardar tus CVs."
      );
      return;
    }

    onSaveCv?.(cvData);

    setSaveSuccess(
      cvLanguage === "en"
        ? 'CV saved in "My CVs".'
        : 'CV guardado en "Mis CVs".'
    );
  };


  //  subir foto
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCvData((prev) => ({
        ...prev,
        foto: reader.result, // base64
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setCvData((prev) => ({
      ...prev,
      foto: "",
    }));
  };

  const contactoLinea1 =
    [cvData.email, cvData.telefono, cvData.ubicacion].filter(Boolean).join(" · ") ||
    (cvLanguage === "en"
      ? "email@example.com · +54 9 11 0000-0000 · Buenos Aires, Argentina"
      : "email@ejemplo.com · +54 9 11 0000-0000 · Buenos Aires, Argentina");

  const contactoLinea2 =
    [cvData.linkedin, cvData.github, cvData.sitioWeb].filter(Boolean).join(" · ") ||
    (cvLanguage === "en"
      ? "linkedin.com/in/user · github.com/user · portfolio.com"
      : "linkedin.com/in/usuario · github.com/usuario · portfolio.com");

      const socialLinks = [
        { type: "linkedin", value: cvData.linkedin },
        { type: "github", value: cvData.github },
        {
          type: "web",
          value: cvData.sitioWeb,
        },
      ].filter((link) => !!link.value && link.value.trim() !== "");
    

  // Títulos de secciones según idioma
  const sectionLabels = {
    perfil: cvLanguage === "en" ? "Profile" : "Perfil",
    experiencias: cvLanguage === "en" ? "Experience" : "Experiencias",
    educacion: cvLanguage === "en" ? "Education" : "Educación",
    habilidades: cvLanguage === "en" ? "Skills" : "Habilidades",
    idiomas: cvLanguage === "en" ? "Languages" : "Idiomas",
    proyectos: cvLanguage === "en" ? "Projects" : "Proyectos",
    otros: cvLanguage === "en" ? "Additional information" : "Información adicional",
  };

  // Clase según estilo del CV
  const previewPaperClass = (() => {
    if (cvStyle === "visual") return "cv-preview-paper cv-preview-paper-visual";
    if (cvStyle === "balanceado") return "cv-preview-paper cv-preview-paper-balanced";
    return "cv-preview-paper cv-preview-paper-ats";
  })();

  // Pequeño resumen de preferencias
  const settingsSummary = (() => {
    const langLabel = cvLanguage === "en" ? "Inglés" : "Español";
    const styleLabel =
      cvStyle === "visual"
        ? "Visual"
        : cvStyle === "balanceado"
        ? "Balanceado"
        : "Compatibilidad ATS";

    let base = `Idioma: ${langLabel} · Estilo: ${styleLabel}`;
    if (targetIndustry) {
      base += ` · Rubro: ${targetIndustry}`;
    }
    return base;
  })();


  // 🧠 IA real: llamada al backend
  const handleAskAi = async () => {
    setAiLoading(true);
    setAiError("");
    setAiSuggestion("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/optimizar-cv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: aiSection,
          content: cvData[aiSection],
          jobDescription: jobDesc,
          language: cvLanguage,
          targetIndustry,
        }),
      });

      const text = await response.text();
      console.log("📩 Respuesta cruda del backend:", response.status, text);

      if (!response.ok) {
        throw new Error(`Respuesta no OK del servidor: ${response.status}`);
      }

      const data = JSON.parse(text);

      if (!data.suggestion) {
        throw new Error("La respuesta no contiene 'suggestion'");
      }

      setAiSuggestion(data.suggestion);
    } catch (err) {
      console.error("Error en handleAskAi:", err);
      setAiError(
        cvLanguage === "en"
          ? "There was a problem connecting to the AI."
          : "Hubo un problema al conectarse con la IA."
      );
    } finally {
      setAiLoading(false);
    }
  };




  const applyAiSection = () => {
    if (!aiSuggestion) return;
    setCvData((prev) => ({
      ...prev,
      [aiSection]: aiSuggestion,
    }));
    setAiOpen(false);
  };

  const closeAiPanel = () => {
    if (aiLoading) return;
    setAiOpen(false);
  };

  const pasos = [
  {
    titulo: "Elegí la configuración del CV",
    descripcion: "Acá podés seleccionar el rubro/estilo del CV antes de completarlo.",
    ref: refBtnConfiguracion,
  },
  {
    titulo: "Completá tu perfil profesional",
    descripcion: "Escribí un resumen breve y claro de quién sos y qué buscás.",
    ref: refTextareaPerfil,
  },
  {
    titulo: "Mejoralo con IA",
    descripcion: "Usá la IA para mejorar el texto y hacerlo más profesional.",
    ref: refBtnIA,
  },
  {
    titulo: "Revisá la vista previa",
    descripcion: "La vista previa se actualiza en tiempo real mientras completás los datos.",
    ref: refVistaPrevia,
  },
];

  const pasoActual = pasos[pasoTutorial];

  const pasoTutorialRef = useRef(pasoTutorial);

  useEffect(() => {
    pasoTutorialRef.current = pasoTutorial;
  }, [pasoTutorial]);


  const [posicionPaso, setPosicionPaso] = useState(null);

const calcularPosicionPaso = (indicePaso) => {
    if (!tutorialActivo) return;

    const paso = pasos[indicePaso];
    if (!paso?.ref?.current) return;

    const el = paso.ref.current;
    const rect = el.getBoundingClientRect();
    
    // Dimensiones del viewport
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Configuración
    const margen = 16;
    const anchoModal = 520; // Coincide con el max-width del CSS
    
    // 1. Lógica Vertical: ¿Arriba o Abajo?
    // Si el elemento está más abajo del 60% de la pantalla, ponemos el modal ARRIBA.
    const ponerArriba = rect.top > (vh * 0.6);

    // 2. Lógica Horizontal: Centrado Inteligente con Clamp
    // Intentamos centrar el modal respecto al elemento resaltado
    let leftCalculado = rect.left + (rect.width / 2) - (anchoModal / 2);

    // Clamp: Evitamos que se salga por la izquierda (mínimo margen)
    if (leftCalculado < margen) leftCalculado = margen;
    
    // Clamp: Evitamos que se salga por la derecha
    if (leftCalculado + anchoModal > vw - margen) {
      leftCalculado = vw - anchoModal - margen;
    }

    setPosicionPaso({
      // Coordenadas para el Highlight (caja hueca)
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,

      // Datos para posicionar el Modal
      modalLeft: leftCalculado,
      ponerArriba, // Booleano clave
      // Puntos de anclaje
      anchorTop: rect.top - margen,       // Dónde termina el modal si va arriba
      anchorBottom: rect.bottom + margen, // Dónde empieza el modal si va abajo
    });
  };



  useEffect(() => {
    if (!tutorialActivo) return;

    const paso = pasos[pasoTutorial];
    if (!paso?.ref?.current) return;

    const el = paso.ref.current;

    el.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calcularPosicionPaso(pasoTutorial);

        if (pasoTutorial === 2) {
          setTimeout(() => {
            if (!tutorialActivo) return;
            if (pasoTutorialRef.current !== 2) return;
            calcularPosicionPaso(2);
          }, 120);
        }
      });
    });
  }, [tutorialActivo, pasoTutorial]);



  const marcarTutorialComoVisto = () => {
    localStorage.setItem("joblu_tutorial_cv_v1", "1");
  };

  const cerrarTutorial = () => {
    setTutorialActivo(false);
    marcarTutorialComoVisto();
  };

  const siguientePaso = () => {
    const ultimo = pasoTutorial >= pasos.length - 1;
    if (ultimo) {
      cerrarTutorial();
      return;
    }
    setPasoTutorial((prev) => prev + 1);
  };


  return (
      <div className="cv-page">
        {tutorialActivo && pasoActual?.ref?.current && (
      <div className="tutorial-overlay">
        {posicionPaso && (
          <div
            className="tutorial-highlight"
            style={{
              top: posicionPaso.top,
              left: posicionPaso.left,
              width: posicionPaso.width,
              height: posicionPaso.height,
            }}
          />
        )}

      <div
        ref={refTutorialModal}
        className="tutorial-modal"
        style={
          posicionPaso
            ? {
                left: posicionPaso.modalLeft,
                // Si va arriba: Anulamos 'top' y usamos 'bottom' calculado desde el borde inferior
                top: posicionPaso.ponerArriba ? "auto" : posicionPaso.anchorBottom,
                bottom: posicionPaso.ponerArriba 
                  ? (window.innerHeight - posicionPaso.anchorTop) 
                  : "auto",
              }
            : undefined
        }
      >




      <p className="tutorial-paso">Paso {pasoTutorial + 1} de {pasos.length}</p>
      <h3 className="tutorial-titulo">{pasoActual.titulo}</h3>
      <p className="tutorial-descripcion">{pasoActual.descripcion}</p>

      <div className="tutorial-acciones">
        <button type="button" className="tutorial-btn-secundario" onClick={cerrarTutorial}>
          Omitir
        </button>
        <button type="button" className="tutorial-btn-principal" onClick={siguientePaso}>
          Siguiente
        </button>
      </div>
    </div>
  </div>
)}


    <section className="cv-builder">
      {/* 📝 Columna izquierda - Formulario */}
      <div className="cv-column">

        <div className="cv-settings-toggle">
          <button
            ref={refBtnConfiguracion}
            type="button"
            className="cv-settings-toggle-btn"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            {showSettings
              ? "Ocultar configuración de CV"
              : "Mostrar configuración de CV"}
          </button>

          {showSettings && (
            <div className="cv-settings-panel">
              <Settings
                user={user}
                settings={settings}
                onChangeSettings={onChangeSettings}
              />
            </div>
          )}
        </div>

        <h2>Completa tu CV</h2>

        {showTips && (
          <div className="cv-settings-tip">
            <strong>Preferencias Joblu: </strong>
            <span>{settingsSummary}</span>
          </div>
        )}

        <form className="cv-form">
          {/* DATOS PERSONALES */}
          <h3 className="cv-form-sectionTitle">Datos personales</h3>

          <div className="cv-form-group-inline">
            <label>
              {cvLanguage === "en" ? "Full name:" : "Nombre completo:"}
              <input
                type="text"
                name="nombre"
                value={cvData.nombre}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. Sofia Martinez"
                    : "Ej: Sofía Martínez"
                }
              />
            </label>

            <label>
              {cvLanguage === "en"
                ? "Job title / role:"
                : "Puesto o título profesional:"}
              <input
                type="text"
                name="puesto"
                value={cvData.puesto}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. Frontend Developer"
                    : "Ej: Desarrolladora Frontend"
                }
              />
            </label>
          </div>

          <div className="cv-form-group-inline">
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={cvData.email}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. sofia.martinez@mail.com"
                    : "Ej: sofi.martinez@mail.com"
                }
              />
            </label>

            <label>
              {cvLanguage === "en" ? "Phone:" : "Teléfono:"}
              <input
                type="text"
                name="telefono"
                value={cvData.telefono}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. +54 9 11 0000-0000"
                    : "Ej: +54 9 11 0000-0000"
                }
              />
            </label>
          </div>

          <div className="cv-form-group-inline">
            <label>
              {cvLanguage === "en" ? "Location:" : "Ubicación:"}
              <input
                type="text"
                name="ubicacion"
                value={cvData.ubicacion}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. Buenos Aires, Argentina"
                    : "Ej: Buenos Aires, Argentina"
                }
              />
            </label>

            <label>
              {cvLanguage === "en" ? "Website / Portfolio:" : "Sitio web / Portfolio:"}
              <input
                type="text"
                name="sitioWeb"
                value={cvData.sitioWeb}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. myportfolio.com"
                    : "Ej: miportfolio.com"
                }
              />
            </label>
          </div>

          <div className="cv-form-group-inline">
            <label>
              LinkedIn:
              <input
                type="text"
                name="linkedin"
                value={cvData.linkedin}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. linkedin.com/in/user"
                    : "Ej: linkedin.com/in/usuario"
                }
              />
            </label>

            <label>
              GitHub:
              <input
                type="text"
                name="github"
                value={cvData.github}
                onChange={handleChange}
                placeholder={
                  cvLanguage === "en"
                    ? "e.g. github.com/user"
                    : "Ej: github.com/usuario"
                }
              />
            </label>
          </div>

          {/* FOTO */}
          {includePhoto && (
            <div className="cv-form-photo">
              <label>
                {cvLanguage === "en" ? "Profile picture:" : "Foto de perfil:"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>

              {cvData.foto && (
                <button
                  type="button"
                  className="cv-photo-remove-btn"
                  onClick={handleRemovePhoto}
                >
                  {cvLanguage === "en" ? "Remove photo" : "Quitar foto"}
                </button>
              )}
            </div>
          )}

          {/* PERFIL */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Professional profile" : "Perfil profesional"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("perfil")}
            >
              {sectionsVisible.perfil
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            {cvLanguage === "en" ? "Summary:" : "Resumen:"}
            <textarea
              ref={refTextareaPerfil}
              name="perfil"
              value={cvData.perfil}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? "Write a short summary about your background, experience and goals..."
                  : "Escribe una breve descripción sobre vos, tu experiencia y objetivos..."
              }
              rows="3"
            ></textarea>
          </label>

          {/* EXPERIENCIA */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Work experience" : "Experiencia laboral"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("experiencias")}
            >
              {sectionsVisible.experiencias
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            <textarea
              name="experiencias"
              value={cvData.experiencias}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? `e.g.:
Company X · Frontend Developer · 2023 - Present
- Responsibility or achievement 1
- Responsibility or achievement 2`
                  : `Ej:
Empresa X · Desarrollador Frontend · 2023 - Actualidad
- Responsabilidad o logro 1
- Responsabilidad o logro 2`
              }
              rows="4"
            ></textarea>
          </label>

          {/* EDUCACIÓN */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Education" : "Educación"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("educacion")}
            >
              {sectionsVisible.educacion
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            <textarea
              name="educacion"
              value={cvData.educacion}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? `e.g.:
University X · Web Development · 2022 - Present`
                  : `Ej:
Universidad X · Tecnicatura en Desarrollo Web · 2022 - Actualidad`
              }
              rows="3"
            ></textarea>
          </label>

          {/* HABILIDADES */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Skills" : "Habilidades"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("habilidades")}
            >
              {sectionsVisible.habilidades
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            {cvLanguage === "en"
              ? "Skills (comma or dash separated):"
              : "Habilidades (separadas por coma o guiones):"}
            <input
              type="text"
              name="habilidades"
              value={cvData.habilidades}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? "e.g.: HTML, CSS, JavaScript, React, Git, teamwork..."
                  : "Ej: HTML, CSS, JavaScript, React, Git, trabajo en equipo..."
              }
            />
          </label>

          {/* IDIOMAS */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Languages" : "Idiomas"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("idiomas")}
            >
              {sectionsVisible.idiomas
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            <input
              type="text"
              name="idiomas"
              value={cvData.idiomas}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? "e.g.: Native Spanish · English B2 · Portuguese A2"
                  : "Ej: Español nativo · Inglés B2 · Portugués A2"
              }
            />
          </label>

          {/* PROYECTOS */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Projects" : "Proyectos"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("proyectos")}
            >
              {sectionsVisible.proyectos
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            <textarea
              name="proyectos"
              value={cvData.proyectos}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? `e.g.:
Personal portfolio · React · 2024
- Responsive website to showcase my work`
                  : `Ej:
Proyecto portafolio personal · React · 2024
- Sitio web responsive para mostrar mis trabajos`
              }
              rows="3"
            ></textarea>
          </label>

          {/* OTROS */}
          <div className="cv-form-sectionHeader">
            <h3 className="cv-form-sectionTitle">
              {cvLanguage === "en" ? "Additional information" : "Información adicional"}
            </h3>
            <button
              type="button"
              className="cv-section-toggle"
              onClick={() => toggleSection("otros")}
            >
              {sectionsVisible.otros
                ? "− Ocultar del CV"
                : "+ Mostrar en el CV"}
            </button>
          </div>

          <label>
            {cvLanguage === "en"
              ? "Courses, certifications, interests, etc.:"
              : "Cursos, certificaciones, intereses, etc.:"}
            <textarea
              name="otros"
              value={cvData.otros}
              onChange={handleChange}
              placeholder={
                cvLanguage === "en"
                  ? "e.g.: online courses, certifications, volunteering, relevant interests..."
                  : "Ej: Cursos online, certificaciones, voluntariados, intereses relevantes..."
              }
              rows="3"
            ></textarea>
          </label>
        </form>

        <div className="cv-actions">
                <button 
                  type="button" 
                  className="cv-action-btn save-btn"  
                  onClick={handleSave}
                >
                  {cvLanguage === "en" ? "Save CV" : "Guardar CV"}
                </button>

                <button
                  type="button"
                  className="cv-action-btn download-btn" 
                  onClick={handleDownloadPDF}
                >
                  {cvLanguage === "en" ? "Download PDF" : "Descargar PDF"}
                </button>

                <button
                  ref={refBtnIA}
                  type="button"
                  className="cv-action-btn ai-btn" 
                  onClick={() => setAiOpen(true)}
                >
                  💡 {cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                </button>
              
              {(saveError || saveSuccess) && (
                <p
                  className={
                    "cv-save-message " +
                    (saveError
                      ? "cv-save-message--error"
                      : "cv-save-message--success")
                  }
                >
                  {saveError || saveSuccess}
                </p>
              )}
        </div>
      </div>

      {/* 👀 Columna derecha - Vista previa */}
      <div className="cv-column">
        <h2>{cvLanguage === "en" ? "Preview" : "Vista previa"}</h2>
        <div className="cv-preview-wrapper" ref={refVistaPrevia}>
          <div className={previewPaperClass} ref={cvRef}>
            <div className="cv-preview-header">
              <div>
                <h1>
                  {cvData.nombre ||
                    (cvLanguage === "en" ? "Name Surname" : "Nombre Apellido")}
                </h1>
                <h3 className="cv-preview-job-title">
                  {cvData.puesto ||
                    (cvLanguage === "en"
                      ? "Desired role / Job title"
                      : "Puesto deseado / Rol profesional")}
                </h3>
              </div>

              {includePhoto &&
                (cvData.foto ? (
                  <img
                    src={cvData.foto}
                    alt="Foto de perfil"
                    className="cv-photo-preview"
                  />
                ) : (
                  <div className="cv-photo-placeholder">
                    {cvLanguage === "en" ? "Photo" : "Foto"}
                  </div>
                ))}
            </div>

            <section className="cv-preview-contact">
              <p>{contactoLinea1}</p>

              {socialLinks.length > 0 ? (
                <div className="cv-contact-social">
                  {socialLinks.map((link) => {
                    const raw = link.value.trim();
                    const needsProtocol = !raw.startsWith("http://") && !raw.startsWith("https://");
                    const url = needsProtocol ? `https://${raw}` : raw;

                    let iconLabel = "";
                    if (link.type === "linkedin") iconLabel = "in";
                    else if (link.type === "github") iconLabel = "<>";
                    else iconLabel = "🌐";

                    return (
                      <a
                        key={link.type}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cv-contact-link"
                      >
                        <span className="cv-contact-icon">{iconLabel}</span>
                        <span className="cv-contact-text">{raw}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p>{contactoLinea2}</p>
              )}
            </section>


            <hr className="cv-preview-divider" />

            {sectionsVisible.perfil && (
              <section>
                <h4>{sectionLabels.perfil}</h4>
                <p className="cv-preview-paragraph">
                  {cvData.perfil ||
                    (cvLanguage === "en"
                      ? "Short introduction about your profile and goals..."
                      : "Texto de presentación breve sobre tu perfil profesional...")}
                </p>
              </section>
            )}

            {sectionsVisible.experiencias && (
              <section className="cv-preview-section">
                <h4>{sectionLabels.experiencias}</h4>
                <p className="cv-preview-paragraph-preline">
                  {cvData.experiencias ||
                    (cvLanguage === "en"
                      ? "Mian work experience..."
                      : "Tu experiencia laboral...")}
                </p>
              </section>
            )}

            {sectionsVisible.educacion && (
              <section className="cv-preview-section">
                <h4>{sectionLabels.educacion}</h4>
                <p className="cv-preview-paragraph-preline">
                  {cvData.educacion ||
                    (cvLanguage === "en"
                      ? "Main academic background..."
                      : "Formación académica principal...")}
                </p>
              </section>
            )}

            {sectionsVisible.habilidades && (
              <section className="cv-preview-section">
                <h4>{sectionLabels.habilidades}</h4>
                <p className="cv-preview-paragraph">
                  {cvData.habilidades ||
                    (cvLanguage === "en"
                      ? "e.g.: HTML · CSS · JavaScript · React · Teamwork"
                      : "Ej: HTML · CSS · JavaScript · React · Trabajo en equipo")}
                </p>
              </section>
            )}

            {sectionsVisible.idiomas && (
              <section className="cv-preview-section">
                <h4>{sectionLabels.idiomas}</h4>
                <p className="cv-preview-paragraph">
                  {cvData.idiomas ||
                    (cvLanguage === "en"
                      ? "e.g.: Native Spanish · English B2"
                      : "Ej: Español nativo · Inglés B2")}
                </p>
              </section>
            )}

            {sectionsVisible.proyectos && (
              <section className="cv-preview-section">
                <h4>{sectionLabels.proyectos}</h4>
                <p className="cv-preview-paragraph-preline">
                  {cvData.proyectos ||
                    (cvLanguage === "en"
                      ? "Relevant projects you want to highlight..."
                      : "Proyectos relevantes que quieras destacar...")}
                </p>
              </section>
            )}

            {sectionsVisible.otros && (
              <section className="cv-preview-section">
                <h4>{sectionLabels.otros}</h4>
                <p className="cv-preview-paragraph-preline">
                  {cvData.otros ||
                    (cvLanguage === "en"
                      ? "Courses, certifications, volunteering, interests..."
                      : "Cursos, certificaciones, voluntariados, intereses...")}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* 🧠 Panel lateral de IA */}
            {aiOpen && (
        <>
          <div className="cv-ai-backdrop" onClick={closeAiPanel} />

          <div className="cv-ai-panel">
            {/* Contenido scrollable del panel */}
            <div className="cv-ai-content">
              <div className="cv-ai-header">
                <h3>Joblu IA</h3>
                <button
                  type="button"
                  className="cv-ai-close"
                  onClick={closeAiPanel}
                >
                  ✕
                </button>
              </div>

              <p className="cv-ai-tagline">
                {cvLanguage === "en"
                  ? "Simulated assistant to improve your CV."
                  : "Asistente simulado para mejorar tu CV."}
              </p>

              <div className="cv-ai-body">
                <label>
                  {cvLanguage === "en"
                    ? "Job description (optional, paste the job ad):"
                    : "Descripción del puesto (opcional, pega la oferta de trabajo):"}
                  <textarea
                    rows="4"
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder={
                      cvLanguage === "en"
                        ? "Paste here the job description or main requirements..."
                        : "Pegá acá la descripción del puesto o los requisitos principales..."
                    }
                  ></textarea>
                </label>

                <label>
                  {cvLanguage === "en"
                    ? "Which section do you want to improve?"
                    : "¿Qué sección querés mejorar?"}
                  <select
                    value={aiSection}
                    onChange={(e) => setAiSection(e.target.value)}
                  >
                    <option value="perfil">
                      {cvLanguage === "en" ? "Profile" : "Perfil profesional"}
                    </option>
                    <option value="experiencias">
                      {cvLanguage === "en"
                        ? "Experience"
                        : "Experiencia laboral"}
                    </option>
                    <option value="educacion">
                      {cvLanguage === "en" ? "Education" : "Educación"}
                    </option>
                    <option value="habilidades">
                      {cvLanguage === "en" ? "Skills" : "Habilidades"}
                    </option>
                    <option value="otros">
                      {cvLanguage === "en"
                        ? "Additional information"
                        : "Información adicional"}
                    </option>
                  </select>
                </label>

                <button
                  type="button"
                  className="cv-ai-generate"
                  onClick={handleAskAi}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? cvLanguage === "en"
                      ? "Thinking..."
                      : "Pensando..."
                    : cvLanguage === "en"
                    ? "Generate suggestion (mock)"
                    : "Generar sugerencia (simulada)"}
                </button>

                {aiError && <p className="cv-ai-error">{aiError}</p>}

                {aiSuggestion && (
                  <div className="cv-ai-suggestion">
                    <h4>
                      {cvLanguage === "en"
                        ? "Suggested text"
                        : "Texto sugerido"}
                    </h4>
                    <pre>{aiSuggestion}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Footer fijo con el botón de aplicar */}
            <div className="cv-ai-footer">
              <button
                type="button"
                className="cv-ai-apply"
                onClick={applyAiSection}
                disabled={!aiSuggestion}
              >
                {cvLanguage === "en"
                  ? "Apply suggestion to CV"
                  : "Aplicar sugerencia al CV"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
    </div>
  );
}


export default CvBuilder;
