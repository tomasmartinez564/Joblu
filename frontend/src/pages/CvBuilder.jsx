import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

// --- Estilos ---
import "../styles/cvbuilder.css";

// --- Componentes y Páginas ---
import Settings from "./Settings";
import CvForm from "../components/cv/CvForm";

// --- Servicios y Configuración ---
import API_BASE_URL from "../config/api";
import cvService from "../services/cvService";

// ==========================================
// 📋 CONSTANTES Y ESTADOS INICIALES
// ==========================================
const emptyCv = {
  nombre: "",
  puesto: "",
  email: "",
  telefono: "",
  ubicacion: "",
  sitioWeb: "",
  linkedin: "",
  github: "",
  perfil: "",
  experiencias: "",
  educacion: "",
  habilidades: "",
  idiomas: "",
  proyectos: "",
  otros: "",
  foto: "",
};

// ==========================================
// 🏗️ COMPONENTE: CV BUILDER
// ==========================================
function CvBuilder({ user, settings, onChangeSettings }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLogged = !!user;

  // --- 1. Desestructuración de Preferencias ---
  const {
    cvLanguage = "es",
    cvStyle = "ats",
    includePhoto = true,
    showTips = true,
    targetIndustry = "",
  } = settings || {};

  // --- 2. Estados: Datos del CV ---
  const [cvData, setCvData] = useState(emptyCv);
  const [sectionsVisible, setSectionsVisible] = useState({
    perfil: true,
    experiencias: true,
    educacion: true,
    habilidades: true,
    idiomas: false,
    proyectos: true,
    otros: true,
  });

  // --- 3. Estados: Interfaz (UI) ---
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // --- 4. Estados: Inteligencia Artificial ---
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSection, setAiSection] = useState("perfil");
  const [jobDesc, setJobDesc] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiTone, setAiTone] = useState("Professional");
  const [aiGoal, setAiGoal] = useState("improve");

  // --- 5. Estados: Tutorial (Onboarding) ---
  const [tutorialActivo, setTutorialActivo] = useState(false);
  const [pasoTutorial, setPasoTutorial] = useState(0);
  const [posicionPaso, setPosicionPaso] = useState(null);

  // --- 6. Estados: Navegación por Pasos (Slides) ---
  const [activeStep, setActiveStep] = useState(0);

  const STEPS = [
    { key: "datos", label: "Datos Personales" },
    { key: "perfil", label: "Perfil Profesional" },
    { key: "experiencias", label: "Experiencia Laboral" },
    { key: "educacion", label: "Educación" },
    { key: "habilidades", label: "Habilidades" },
    { key: "idiomas", label: "Idiomas" },
    { key: "proyectos", label: "Proyectos" },
    { key: "otros", label: "Información Adicional" }
  ];

  // --- 7. Refs ---
  const cvRef = useRef(null);
  const refBtnConfiguracion = useRef(null);
  const refTextareaPerfil = useRef(null);
  const refBtnIA = useRef(null);
  const refVistaPrevia = useRef(null);
  const refTutorialModal = useRef(null);
  const pasoTutorialRef = useRef(pasoTutorial);

  // ... (Efectos y lógica de carga se mantienen igual) ...

  // ==========================================
  // 🧠 LÓGICA DE CARGA Y PERSISTENCIA
  // ==========================================

  useEffect(() => {
    if (id) loadCvForEdit(id);
    else setCvData(emptyCv);
  }, [id]);

  const loadCvForEdit = async (cvId) => {
    try {
      const response = await cvService.getById(cvId);
      const cvContent = response.data || {};
      const mergedData = { ...emptyCv, ...(Object.keys(cvContent).length > 0 ? cvContent : response) };

      if (!mergedData.foto) mergedData.foto = "";
      if (!mergedData.nombre && response.title) mergedData.nombre = response.title;
      if (!mergedData.puesto && response.puesto) mergedData.puesto = response.puesto;

      // Sanitización simplificada (se mantiene la lógica existente)
      // ... (código de sanitización omitido por brevedad, se asume que sigue igual) ...
      // Nota: Si no incluimos la sanitización completa aquí, asegúrate de no borrarla si no se muestra en el original.
      // Como replace_file_content reemplaza el bloque, debo asegurarme de incluir todo lo que estoy reemplazando.
      // Voy a asumir que el bloque original llega hasta la línea 391. 
      // Re-copiaré la lógica de sanitización para estar seguro.

      Object.keys(mergedData).forEach(key => {
        const val = mergedData[key];
        if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            mergedData[key] = val.map(item => {
              if (typeof item === 'object' && item !== null) {
                const titulo = item.puesto || item.title || item.role || item.position || item.titulo || item.degree || item.name || item.nombre || "";
                const entidad = item.empresa || item.company || item.institucion || item.institution || item.university || item.school || "";
                const fecha = item.fecha || item.date || item.period || item.years || item.year || "";
                const descripcion = item.descripcion || item.description || item.summary || item.details || "";

                if (titulo || entidad) {
                  let linea1 = [titulo, entidad, fecha].filter(Boolean).join(" · ");
                  return descripcion ? `${linea1}\n${descripcion}` : linea1;
                }
                return Object.values(item).join(" · ");
              }
              return String(item);
            }).join('\n\n');
          } else {
            mergedData[key] = Object.values(val).join("\n");
          }
        } else if (val === null || val === undefined) {
          mergedData[key] = "";
        } else {
          mergedData[key] = String(val);
        }
      });

      setCvData(mergedData);
    } catch (error) {
      console.error("Error cargando CV:", error);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setSaveError("");
    setSaveSuccess("");

    if (!isLogged) {
      setSaveError(cvLanguage === "en" ? "You need to log in to save your CVs." : "Tenés que iniciar sesión para guardar tus CVs.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: cvData.nombre || "CV sin nombre",
        puesto: cvData.puesto || "",
        data: cvData,
      };

      if (id) {
        await cvService.update(id, payload);
        setSaveSuccess(cvLanguage === "en" ? "CV updated." : "CV actualizado correctamente.");
      } else {
        const newCv = await cvService.create(payload);
        setSaveSuccess(cvLanguage === "en" ? "CV created." : "CV creado correctamente.");
        navigate(`/cv/${newCv._id}`, { replace: true });
      }
    } catch (error) {
      setSaveError(error.message || "Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // ✨ LÓGICA DE INTELIGENCIA ARTIFICIAL
  // ==========================================
  const [aiContent, setAiContent] = useState("");

  const handleAskAi = async () => {
    setAiLoading(true);
    setAiError("");
    setAiSuggestion("");

    try {
      const data = await cvService.optimize({
        section: aiSection,
        content: aiContent || cvData[aiSection], // Usar contenido específico o fallback al general
        jobDescription: jobDesc,
        language: cvLanguage,
        targetIndustry,
        tone: aiTone,
        goal: aiGoal
      });
      // ... (rest of handleAskAi is same just ensure closing brace matches)

      if (!data.suggestion) throw new Error("La respuesta no contiene 'suggestion'");

      // Limpieza extra por si la IA devuelve "**Perfil**: Texto..."
      let cleanSuggestion = data.suggestion.trim();
      cleanSuggestion = cleanSuggestion.replace(/^\*\*.*?\*\*:?\s*/, "").replace(/^".*?"$/, "$1");

      setAiSuggestion(cleanSuggestion);
    } catch (err) {
      setAiError(cvLanguage === "en" ? "There was a problem connecting to the AI." : "Hubo un problema al conectarse con la IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSection = () => {
    if (!aiSuggestion) return;
    setCvData((prev) => ({ ...prev, [aiSection]: aiSuggestion }));
    setAiOpen(false);
  };

  const handleOpenAiForSection = (sectionName, currentContent = "") => {
    setAiSection(sectionName);
    setAiContent(currentContent || cvData[sectionName] || ""); // Guardar contenido inicial
    setAiOpen(true);
    setAiSuggestion("");
    setAiError("");
  };

  const closeAiPanel = () => { if (!aiLoading) setAiOpen(false); };

  // ==========================================
  // 🎓 LÓGICA DEL TUTORIAL (Onboarding)
  // ==========================================

  const pasos = [
    { titulo: "Elegí la configuración del CV", descripcion: "Acá podés seleccionar el rubro/estilo del CV.", ref: refBtnConfiguracion },
    { titulo: "Completá tu perfil profesional", descripcion: "Escribí un resumen breve y claro de quién sos.", ref: refTextareaPerfil },
    { titulo: "Mejoralo con IA", descripcion: "Usá la IA para hacerlo más profesional.", ref: refBtnIA },
    { titulo: "Revisá la vista previa", descripcion: "Se actualiza en tiempo real mientras completás los datos.", ref: refVistaPrevia },
  ];

  const pasoActual = pasos[pasoTutorial];

  useEffect(() => {
    pasoTutorialRef.current = pasoTutorial;
    if (!tutorialActivo) return;

    const paso = pasos[pasoTutorial];
    if (!paso?.ref?.current) return;

    paso.ref.current.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calcularPosicionPaso(pasoTutorial);
      });
    });
  }, [tutorialActivo, pasoTutorial]);

  const calcularPosicionPaso = (indicePaso) => {
    const paso = pasos[indicePaso];
    if (!paso?.ref?.current) return;

    const rect = paso.ref.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const margen = 16;
    const anchoModal = 520;

    const ponerArriba = rect.top > (vh * 0.6);
    let leftCalculado = rect.left + (rect.width / 2) - (anchoModal / 2);

    if (leftCalculado < margen) leftCalculado = margen;
    if (leftCalculado + anchoModal > vw - margen) leftCalculado = vw - anchoModal - margen;

    setPosicionPaso({
      top: rect.top, left: rect.left, width: rect.width, height: rect.height,
      modalLeft: leftCalculado, ponerArriba,
      anchorTop: rect.top - margen, anchorBottom: rect.bottom + margen,
    });
  };

  const cerrarTutorial = () => {
    setTutorialActivo(false);
    localStorage.setItem("joblu_tutorial_cv_v1", "1");
  };

  const siguientePaso = () => {
    if (pasoTutorial >= pasos.length - 1) cerrarTutorial();
    else setPasoTutorial((prev) => prev + 1);
  };

  useEffect(() => {
    if (!showTips || localStorage.getItem("joblu_tutorial_cv_v1")) return;
    setTutorialActivo(true);
    setPasoTutorial(0);
  }, [showTips]);

  // ==========================================
  // 🛠️ MANEJADORES DE NAVEGACIÓN (Slides)
  // ==========================================
  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleGoToStep = (index) => {
    setActiveStep(index);
    window.scrollTo(0, 0);
  };

  // ==========================================
  // 🛠️ MANEJADORES DE INTERFAZ (UI)
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCvData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCvData((prev) => ({ ...prev, foto: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => setCvData((prev) => ({ ...prev, foto: "" }));

  const toggleSection = (key) => setSectionsVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleDownloadPDF = () => {
    if (!cvRef.current) return;
    const opt = {
      margin: [10, 10],
      filename: `${cvData.nombre || "mi_cv"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };
    html2pdf().set(opt).from(cvRef.current).save();
  };

  // --- Helpers de Renderizado ---
  const sectionLabels = {
    perfil: cvLanguage === "en" ? "Profile" : "Perfil",
    experiencias: cvLanguage === "en" ? "Experience" : "Experiencias",
    educacion: cvLanguage === "en" ? "Education" : "Educación",
    habilidades: cvLanguage === "en" ? "Skills" : "Habilidades",
    idiomas: cvLanguage === "en" ? "Languages" : "Idiomas",
    proyectos: cvLanguage === "en" ? "Projects" : "Proyectos",
    otros: cvLanguage === "en" ? "Additional information" : "Información adicional",
  };

  const previewPaperClass = `cv-preview-paper ${cvStyle === 'visual' ? 'cv-preview-paper-visual' : cvStyle === 'balanceado' ? 'cv-preview-paper-balanced' : 'cv-preview-paper-ats'}`;

  const settingsSummary = `Idioma: ${cvLanguage === "en" ? "Inglés" : "Español"} · Estilo: ${cvStyle === "visual" ? "Visual" : cvStyle === "balanceado" ? "Balanceado" : "Compatibilidad ATS"}${targetIndustry ? ` · Rubro: ${targetIndustry}` : ""}`;

  const contactoLinea1 = [cvData.email, cvData.telefono, cvData.ubicacion].filter(Boolean).join(" · ") || (cvLanguage === "en" ? "email@example.com · +54 9 11 0000-0000 · Buenos Aires" : "email@ejemplo.com · +54 9 11 0000-0000 · Buenos Aires");
  const contactoLinea2 = [cvData.linkedin, cvData.github, cvData.sitioWeb].filter(Boolean).join(" · ") || (cvLanguage === "en" ? "linkedin.com/in/user · github.com/user · portfolio.com" : "linkedin.com/in/usuario · github.com/usuario · portfolio.com");

  const socialLinks = [{ type: "linkedin", value: cvData.linkedin }, { type: "github", value: cvData.github }, { type: "web", value: cvData.sitioWeb }].filter(l => !!l.value && l.value.trim() !== "");

  // ==========================================
  // 📦 RENDERIZADO (JSX)
  // ==========================================
  return (
    <div className="cv-page">
      {/* --- Tutorial Overlay --- */}
      {tutorialActivo && pasoActual?.ref?.current && (
        <div className="tutorial-overlay">
          {posicionPaso && (
            <div className="tutorial-highlight" style={{ top: posicionPaso.top, left: posicionPaso.left, width: posicionPaso.width, height: posicionPaso.height }} />
          )}
          <div ref={refTutorialModal} className="tutorial-modal" style={posicionPaso ? { left: posicionPaso.modalLeft, top: posicionPaso.ponerArriba ? "auto" : posicionPaso.anchorBottom, bottom: posicionPaso.ponerArriba ? (window.innerHeight - posicionPaso.anchorTop) : "auto" } : undefined}>
            <p className="tutorial-paso">Paso {pasoTutorial + 1} de {pasos.length}</p>
            <h3 className="tutorial-titulo">{pasoActual.titulo}</h3>
            <p className="tutorial-descripcion">{pasoActual.descripcion}</p>
            <div className="tutorial-acciones">
              <button type="button" className="tutorial-btn-secundario" onClick={cerrarTutorial}>Omitir</button>
              <button type="button" className="tutorial-btn-principal" onClick={siguientePaso}>Siguiente</button>
            </div>
          </div>
        </div>
      )}

      <section className="cv-builder">
        {/* --- Columna Formulario --- */}
        <div className="cv-column">
          <div className="cv-settings-toggle">
            <button ref={refBtnConfiguracion} type="button" className="cv-settings-toggle-btn" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? "Ocultar configuración de CV" : "Mostrar configuración de CV"}
            </button>
            {showSettings && (
              <div className="cv-settings-panel">
                <Settings user={user} settings={settings} onChangeSettings={onChangeSettings} />
              </div>
            )}
          </div>

          <h2>Completa tu CV</h2>

          {/* Indicador de Pasos */}
          <div className="cv-steps-indicator">
            <div className="steps-progress-bar">
              <div
                className="steps-progress-fill"
                style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="steps-text">
              Paso {activeStep + 1} de {STEPS.length}: <strong>{STEPS[activeStep].label}</strong>
            </p>
          </div>

          {showTips && <div className="cv-settings-tip"><strong>Preferencias Joblu: </strong><span>{settingsSummary}</span></div>}

          <CvForm
            cvData={cvData}
            onChange={handleChange}
            settings={settings}
            sectionsVisible={sectionsVisible}
            onPhotoChange={handlePhotoChange}
            onRemovePhoto={handleRemovePhoto}
            onImprove={handleOpenAiForSection}
            refs={{ refTextareaPerfil }}
            activeStep={activeStep}
            steps={STEPS}
            onNext={handleNext}
            onPrev={handlePrev}
            onGoToStep={handleGoToStep}
          />

          {/* Botones de Acción Globales (Guardar/Descargar/IA) movidos al final o integrados en el paso final */}
          <div className="cv-actions">
            <button type="button" className="cv-action-btn save-btn" onClick={handleSave} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? "wait" : "pointer" }}>
              {isSaving ? "Guardando..." : (cvLanguage === "en" ? "Save CV" : "Guardar CV")}
            </button>
            <button type="button" className="cv-action-btn download-btn" onClick={handleDownloadPDF}>
              {cvLanguage === "en" ? "Download PDF" : "Descargar PDF"}
            </button>
            <button ref={refBtnIA} type="button" className="cv-action-btn ai-btn" onClick={() => {
              const currentKey = STEPS[activeStep].key;
              const sectionToUse = currentKey === "datos" ? "perfil" : currentKey; // Si está en datos, sugerir perfil
              handleOpenAiForSection(sectionToUse, cvData[sectionToUse]);
            }}>
              ✨ {cvLanguage === "en" ? "Improve with IA" : "Mejorar con IA"}
            </button>
            {(saveError || saveSuccess) && (
              <p className={"cv-save-message " + (saveError ? "cv-save-message--error" : "cv-save-message--success")}>
                {saveError || saveSuccess}
              </p>
            )}
          </div>
        </div>

        {/* --- Columna Vista Previa --- */}
        <div className="cv-column">
          <h2>{cvLanguage === "en" ? "Preview" : "Vista previa"}</h2>
          <div className="cv-preview-wrapper" ref={refVistaPrevia}>
            <div className={previewPaperClass} ref={cvRef}>
              <div className="cv-preview-header">
                <div>
                  <h1>{cvData.nombre || (cvLanguage === "en" ? "Name Surname" : "Nombre Apellido")}</h1>
                  <h3 className="cv-preview-job-title">{cvData.puesto || (cvLanguage === "en" ? "Desired role / Job title" : "Puesto deseado / Rol profesional")}</h3>
                </div>
                {includePhoto && (cvData.foto ? <img src={cvData.foto} alt="Foto" className="cv-photo-preview" /> : <div className="cv-photo-placeholder">{cvLanguage === "en" ? "Photo" : "Foto"}</div>)}
              </div>

              <section className="cv-preview-contact">
                <p>{contactoLinea1}</p>
                {socialLinks.length > 0 ? (
                  <div className="cv-contact-social">
                    {socialLinks.map(link => {
                      const url = link.value.trim().startsWith("http") ? link.value.trim() : `https://${link.value.trim()}`;
                      return (
                        <a key={link.type} href={url} target="_blank" rel="noopener noreferrer" className="cv-contact-link">
                          <span className="cv-contact-icon">{link.type === 'linkedin' ? 'in' : link.type === 'github' ? '<>' : '🌐'}</span>
                          <span className="cv-contact-text">{link.value.trim()}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : <p>{contactoLinea2}</p>}
              </section>

              <hr className="cv-preview-divider" />

              {/* Secciones del CV */}
              {Object.entries(sectionsVisible).map(([key, visible]) => visible && (
                <section key={key} className="cv-preview-section">
                  <h4>{sectionLabels[key]}</h4>
                  <p className={`cv-preview-paragraph${['experiencias', 'educacion', 'proyectos', 'otros'].includes(key) ? '-preline' : ''}`}>
                    {cvData[key] || (cvLanguage === "en" ? "Add details..." : "Agregá detalles...")}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* --- Panel IA --- */}
        {aiOpen && (
          <>
            <div className="cv-ai-backdrop" onClick={closeAiPanel} />
            <div className="cv-ai-panel">
              <div className="cv-ai-content">
                <div className="cv-ai-header">
                  <h3>Joblu IA</h3>
                  <button type="button" className="cv-ai-close" onClick={closeAiPanel}>✕</button>
                </div>
                <div className="cv-ai-body">
                  <label>{cvLanguage === "en" ? "Text to improve:" : "Texto a mejorar:"}
                    <textarea rows="6" value={aiContent} onChange={(e) => setAiContent(e.target.value)} placeholder={cvLanguage === "en" ? "Content..." : "Contenido..."} />
                  </label>

                  <label>{cvLanguage === "en" ? "Job description (optional):" : "Descripción del puesto (opcional):"}
                    <textarea rows="3" value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder={cvLanguage === "en" ? "Paste the job offer here..." : "Pegá la oferta laboral aquí..."} />
                  </label>
                  <div className="cv-ai-options">
                    <label>{cvLanguage === "en" ? "Tone:" : "Tono:"}
                      <select value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                        <option value="Professional">Profesional</option><option value="Creative">Creativo</option>
                      </select>
                    </label>
                    <label>{cvLanguage === "en" ? "Goal:" : "Objetivo:"}
                      <select value={aiGoal} onChange={(e) => setAiGoal(e.target.value)}>
                        <option value="improve">Mejorar redacción</option><option value="fix">Corregir gramática</option>
                      </select>
                    </label>
                  </div>
                  <button type="button" className="cv-ai-generate" onClick={handleAskAi} disabled={aiLoading || !aiContent}>
                    {aiLoading ? "Pensando..." : "Generar sugerencia"}
                  </button>
                  {aiError && <p className="cv-ai-error">{aiError}</p>}
                  {aiSuggestion && (
                    <div className="cv-ai-comparison">
                      <div className="cv-ai-col"><h4>Original</h4><div className="cv-ai-box original">{aiContent}</div></div>
                      <div className="cv-ai-col"><h4>Sugerido</h4><div className="cv-ai-box suggested">{aiSuggestion}</div></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="cv-ai-footer">
                <button type="button" className="cv-ai-apply" onClick={applyAiSection} disabled={!aiSuggestion}>Aplicar sugerencia</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div >
  );
}

export default CvBuilder;