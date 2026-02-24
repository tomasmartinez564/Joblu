import { useState, useRef, useEffect, Fragment } from "react";
import { FaLinkedin, FaGithub, FaGlobe, FaCog, FaTrashAlt, FaExclamationTriangle, FaLock } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import TEMPLATES from "../data/templates";
import OnboardingTour, { LS_KEY } from "../components/cv/OnboardingTour";


// --- Estilos ---
import "../styles/cvbuilder.css";
import "../styles/jobs-detail.css";

// --- Componentes y Páginas ---

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
  experiencias: "", // Obsoleto, mantenido por compatibilidad
  experience: [], // Nueva estructura
  educacion: "",
  habilidades: "", // Obsoleto
  skills: [], // Nueva estructura
  idiomas: "", // Obsoleto
  languages: [], // Nueva estructura
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
  const location = useLocation();
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
  const [cvData, setCvData] = useState(() => {
    const draftKey = `joblu_cv_draft_${id || "new"}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return emptyCv;
  });
  const [sectionsVisible, setSectionsVisible] = useState({
    perfil: true,
    educacion: true,
    habilidades: true,
    idiomas: true, // Cambiado de false a true
    proyectos: true,
    otros: true,
    linkedin: true, // Visibilidad específica del link
    github: true,   // Visibilidad específica del link
    sitioWeb: true, // Visibilidad específica del link
  });

  // --- 3. Estados: Interfaz (UI) ---

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateId, setTemplateId] = useState("ats-classic");
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

  // --- 5. Estados: Onboarding Tour ---
  const [tourActive, setTourActive] = useState(false);

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

  const normalizeHashTarget = (hash) => {
    if (!hash) return "";
    return hash.replace(/^#/, "").toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Limpia tildes
      .replace(/\s+/g, "-");
  };

  const resolveStepKeyFromHash = (rawHash) => {
    const normalized = normalizeHashTarget(rawHash);
    const aliases = {
      "experiencia": "experiencias",
      "contacto": "datos",
      "info-adicional": "otros",
      "informacion-adicional": "otros"
    };
    return aliases[normalized] || normalized;
  };

  useEffect(() => {
    if (location.hash) {
      const resolvedKey = resolveStepKeyFromHash(location.hash);
      const stepIndex = STEPS.findIndex(s => s.key === resolvedKey);
      if (stepIndex >= 0) {
        setActiveStep(stepIndex);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 50);
      }
    }
  }, [location.hash]); // Se ejecuta al montar y cada vez que cambia el hash

  // --- 7. Refs ---
  const cvRef = useRef(null);
  const refBtnConfiguracion = useRef(null);
  const refTextareaPerfil = useRef(null);
  const refBtnIA = useRef(null);
  const refVistaPrevia = useRef(null);

  // ... (Efectos y lógica de carga se mantienen igual) ...

  // ==========================================
  // 🧠 LÓGICA DE CARGA Y PERSISTENCIA
  // ==========================================

  useEffect(() => {
    const draftKey = `joblu_cv_draft_${id || "new"}`;
    if (id) {
      if (!localStorage.getItem(draftKey)) loadCvForEdit(id);
    } else {
      if (!localStorage.getItem(draftKey)) setCvData(emptyCv);
      // Si viene del dashboard con una plantilla preseleccionada
      if (location.state?.templateId) {
        setTemplateId(location.state.templateId);
      }
    }
  }, [id]);

  // Autoguardado en LocalStorage
  useEffect(() => {
    const draftKey = `joblu_cv_draft_${id || "new"}`;
    localStorage.setItem(draftKey, JSON.stringify(cvData));
  }, [cvData, id]);

  const loadCvForEdit = async (cvId) => {
    try {
      const response = await cvService.getById(cvId);
      const cvContent = response.data || {};
      const mergedData = { ...emptyCv, ...(Object.keys(cvContent).length > 0 ? cvContent : response) };

      if (!mergedData.foto) mergedData.foto = "";
      if (!mergedData.nombre && response.title) mergedData.nombre = response.title;
      if (!mergedData.puesto && response.puesto) mergedData.puesto = response.puesto;

      // Restaurar templateId guardado
      if (response.templateId) setTemplateId(response.templateId);

      // Restaurar estado de visibilidad de secciones si existe
      if (response.data && response.data.sectionsVisible) {
        setSectionsVisible((prev) => ({ ...prev, ...response.data.sectionsVisible }));
      }

      // Retrocompatibilidad: Si hay texto en 'experiencias' y 'experience' está vacío
      if (!Array.isArray(mergedData.experience)) {
        mergedData.experience = [];
      }

      if (mergedData.experiencias && typeof mergedData.experiencias === 'string' && mergedData.experiencias.trim() !== "" && mergedData.experience.length === 0) {
        mergedData.experience = [{
          id: Date.now().toString(),
          position: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: mergedData.experiencias
        }];
        // mergedData.experiencias = ""; // Opcional: borrar el viejo
      }

      // Retrocompatibilidad Habilidades
      if (!Array.isArray(mergedData.skills)) mergedData.skills = [];
      if (typeof mergedData.habilidades === 'string' && mergedData.habilidades.trim() !== "" && mergedData.skills.length === 0) {
        mergedData.skills = mergedData.habilidades.split(',').map(s => s.trim()).filter(s => s);
        mergedData.habilidades = ""; // Limpiar para que no gane en futuros guardados
      }

      // Retrocompatibilidad Idiomas
      if (!Array.isArray(mergedData.languages)) mergedData.languages = [];
      if (typeof mergedData.idiomas === 'string' && mergedData.idiomas.trim() !== "" && mergedData.languages.length === 0) {
        mergedData.languages = mergedData.idiomas.split(',').map(s => s.trim()).filter(s => s);
        mergedData.idiomas = ""; // Limpiar para que no gane en futuros guardados
      }

      // Sanitización simplificada (se mantiene la lógica existente)
      // ... (código de sanitización omitido por brevedad, se asume que sigue igual) ...
      // Nota: Si no incluimos la sanitización completa aquí, asegúrate de no borrarla si no se muestra en el original.
      // Como replace_file_content reemplaza el bloque, debo asegurarme de incluir todo lo que estoy reemplazando.
      // Voy a asumir que el bloque original llega hasta la línea 391. 
      // Re-copiaré la lógica de sanitización para estar seguro.

      Object.keys(mergedData).forEach(key => {
        // Las nuevas estructuras en array y estados anidados se mantienen nativos
        if (['experience', 'skills', 'languages', 'sectionsVisible'].includes(key)) return;

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
        data: { ...cvData, sectionsVisible }, // Persistir la visibilidad
        templateId,
      };

      if (id) {
        await cvService.update(id, payload);
        setSaveSuccess(cvLanguage === "en" ? "CV updated." : "CV actualizado correctamente.");
        localStorage.removeItem(`joblu_cv_draft_${id}`);
      } else {
        const newCv = await cvService.create(payload);
        setSaveSuccess(cvLanguage === "en" ? "CV created." : "CV creado correctamente.");
        localStorage.removeItem("joblu_cv_draft_new");
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


  // Auto-launch tour on first visit
  useEffect(() => {
    const seen = localStorage.getItem(LS_KEY);
    if (!seen) {
      // slight delay so the layout is rendered
      const t = setTimeout(() => setTourActive(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Re-launch tour on custom event (triggered by startCvOnboardingTour())
  useEffect(() => {
    const handler = () => setTourActive(true);
    window.addEventListener("joblu:start-tour", handler);
    return () => window.removeEventListener("joblu:start-tour", handler);
  }, []);

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

  // --- Helpers de Colecciones ---
  const handleExperienceChange = (experiences) => {
    setCvData((prev) => ({ ...prev, experience: experiences }));
  };

  const handleSkillsChange = (skillsList) => {
    setCvData((prev) => ({ ...prev, skills: skillsList }));
  };

  const handleLanguagesChange = (languagesList) => {
    setCvData((prev) => ({ ...prev, languages: languagesList }));
  };

  const handleDownloadPDF = async () => {
    if (!cvRef.current) return;

    const getInlineStylesForPdf = () => {
      let cssText = "";

      // 1) CSS de stylesheets cargadas en la página (Vite / Tailwind / etc.)
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = sheet.cssRules;
          if (!rules) continue;

          for (const rule of Array.from(rules)) {
            cssText += rule.cssText + "\n";
          }
        } catch (err) {
          // Ignorar hojas no accesibles por CORS (por si hubiera externas)
          console.warn("No se pudo leer stylesheet para PDF:", sheet.href, err);
        }
      }

      // 2) (opcional) Asegura colores de impresión
      cssText += `
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `;

      return `<style>${cssText}</style>`;
    };

    try {
      const htmlContent = cvRef.current.outerHTML;
      const styleTags = getInlineStylesForPdf(); // ✅ ESTA LÍNEA FALTABA

      const blob = await cvService.generatePdf(htmlContent, styleTags);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cvData.nombre ? cvData.nombre.replace(/\s+/g, "_") : "Mi_CV_Joblu"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
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

  const previewPaperClass = `cv-preview-paper template-${templateId} ${cvStyle === 'visual' ? 'cv-preview-paper-visual' : cvStyle === 'balanceado' ? 'cv-preview-paper-balanced' : 'cv-preview-paper-ats'}`;

  const settingsSummary = `Idioma: ${cvLanguage === "en" ? "Inglés" : "Español"} · Estilo: ${cvStyle === "visual" ? "Visual" : cvStyle === "balanceado" ? "Balanceado" : "Compatibilidad ATS"}${targetIndustry ? ` · Rubro: ${targetIndustry}` : ""}`;

  const contactoLinea1 = [cvData.email, cvData.telefono, cvData.ubicacion].filter(Boolean).join(" · ") || (cvLanguage === "en" ? <span className="cv-placeholder">email@example.com · +54 9 11 0000-0000 · Buenos Aires</span> : <span className="cv-placeholder">email@ejemplo.com · +54 9 11 0000-0000 · Buenos Aires</span>);

  // Filtrar links sociales basados en si tienen texto Y si están visibles en sectionsVisible (por defecto true si es undefined)
  const socialLinksParams = [
    { type: "linkedin", value: cvData.linkedin, visible: sectionsVisible.linkedin !== false },
    { type: "github", value: cvData.github, visible: sectionsVisible.github !== false },
    { type: "web", value: cvData.sitioWeb, visible: sectionsVisible.sitioWeb !== false }
  ];
  const socialLinks = socialLinksParams.filter(l => !!l.value && l.value.trim() !== "" && l.visible);

  // Textos para fallback placeholder cuando el array está vacío
  let contactoLinea2 = null;
  // Solo mostramos placeholder de los links que están vacíos PERO que SÍ están visibles
  if (socialLinks.length === 0) {
    const placeholders = [];
    if (sectionsVisible.linkedin !== false) placeholders.push(cvLanguage === "en" ? "linkedin.com/in/user" : "linkedin.com/in/usuario");
    if (sectionsVisible.github !== false) placeholders.push(cvLanguage === "en" ? "github.com/user" : "github.com/usuario");
    if (sectionsVisible.sitioWeb !== false) placeholders.push("portfolio.com");

    if (placeholders.length > 0) {
      contactoLinea2 = <span className="cv-placeholder">{placeholders.join(" · ")}</span>;
    }
  }

  // ==========================================
  // 📦 RENDERIZADO (JSX)
  // ==========================================
  return (
    <div className="cv-page" data-tour="cv-layout">
      {/* --- Onboarding Tour --- */}
      <OnboardingTour active={tourActive} onClose={() => setTourActive(false)} />

      <section className="cv-builder">
        {/* --- Columna Formulario --- */}
        <div className="cv-column">


          <div className="cv-header-row" data-tour="cv-header">
            <h2>Completa tu CV</h2>
            <div className="cv-header-actions">
              <button
                ref={refBtnConfiguracion}
                type="button"
                className="cv-settings-gear"
                onClick={() => setSettingsOpen((v) => !v)}
                title="Configuración del CV"
                aria-label="Abrir configuración del CV"
              >
                <FaCog />
              </button>
              <button
                type="button"
                className="cv-settings-gear cv-clear-btn"
                onClick={() => setShowClearModal(true)}
                title={cvLanguage === "en" ? "Clear all fields" : "Borrar todos los campos"}
                aria-label="Borrar todos los campos del CV"
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>

          {/* --- Modal de Configuración --- */}
          {settingsOpen && (
            <>
              <div className="cv-settings-backdrop" onClick={() => setSettingsOpen(false)} />
              <div className="cv-settings-modal">
                <div className="cv-settings-modal-header">
                  <h3>⚙️ Configuración del CV</h3>
                  <button type="button" className="cv-settings-modal-close" onClick={() => setSettingsOpen(false)}>✕</button>
                </div>
                <div className="cv-settings-modal-body">
                  <label>
                    Idioma del CV
                    <select value={cvLanguage} onChange={(e) => onChangeSettings((prev) => ({ ...prev, cvLanguage: e.target.value }))}>
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                    </select>
                  </label>
                  <label>
                    Estilo del CV
                    <select value={cvStyle} onChange={(e) => onChangeSettings((prev) => ({ ...prev, cvStyle: e.target.value }))}>
                      <option value="ats">Compatibilidad ATS</option>
                      <option value="balanceado">Balanceado</option>
                      <option value="visual">Visual</option>
                    </select>
                  </label>
                  <label className="cv-settings-checkbox">
                    <input type="checkbox" checked={includePhoto} onChange={(e) => onChangeSettings((prev) => ({ ...prev, includePhoto: e.target.checked }))} />
                    Incluir foto de perfil
                  </label>
                  <label>
                    Rubro objetivo
                    <input type="text" value={targetIndustry} onChange={(e) => onChangeSettings((prev) => ({ ...prev, targetIndustry: e.target.value }))} placeholder="Ej: Tecnología, Diseño, Marketing..." />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Indicador de Pasos */}
          <div className="cv-steps-indicator" data-tour="cv-step-navigation">
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

          {showTips && <div className="cv-settings-tip" data-tour="cv-preferences"><strong>Preferencias JOBLU: </strong><span>{settingsSummary}</span></div>}

          <div data-tour="cv-form-fields">

            <CvForm
              cvData={cvData}
              onChange={handleChange}
              onExperienceChange={handleExperienceChange}
              onSkillsChange={handleSkillsChange}
              onLanguagesChange={handleLanguagesChange}
              settings={settings}
              sectionsVisible={sectionsVisible}
              onToggleSection={toggleSection}
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
          </div> {/* /cv-form-fields */}

          {/* Botones de Acción Globales */}
          <div className="cv-actions">
            {/* 1. IA — herramienta de asistencia, posición protagonista */}
            <button ref={refBtnIA} type="button" className="cv-action-btn ai-btn" data-tour="cv-ai-button" onClick={() => {
              const currentKey = STEPS[activeStep].key;
              const sectionToUse = currentKey === "datos" ? "perfil" : currentKey;
              handleOpenAiForSection(sectionToUse, cvData[sectionToUse]);
            }}>
              ✨ {cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
            </button>

            {/* 2. Guardar y Descargar — acciones de cierre */}
            <div className="cv-actions-secondary" data-tour="cv-save-actions">
              <button type="button" className="cv-action-btn save-btn" onClick={handleSave} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? "wait" : "pointer" }}>
                {isSaving ? "Guardando..." : (cvLanguage === "en" ? "Save CV" : "Guardar CV")}
              </button>
              <button type="button" className="cv-action-btn download-btn" onClick={handleDownloadPDF}>
                {cvLanguage === "en" ? "Download PDF" : "Descargar PDF"}
              </button>
            </div>

            {(saveError || saveSuccess) && (
              <p className={"cv-save-message " + (saveError ? "cv-save-message--error" : "cv-save-message--success")}>
                {saveError || saveSuccess}
              </p>
            )}
          </div>
        </div>

        {/* --- Columna Vista Previa --- */}
        <div className="cv-column">
          <div className="cv-preview-column-header" data-tour="cv-preview">
            <h2>{cvLanguage === "en" ? "Preview" : "Vista previa"}</h2>
            <button
              type="button"
              className="cv-template-trigger-btn"
              data-tour="cv-template-button"
              onClick={() => setShowTemplateModal(true)}
              title="Cambiar plantilla visual"
            >
              🎨 Plantilla
            </button>
          </div>
          <div className="cv-preview-wrapper" ref={refVistaPrevia}>
            <div className={previewPaperClass} ref={cvRef}>
              <div className="cv-preview-header">
                <div>
                  <h1>{cvData.nombre || <span className="cv-placeholder">{cvLanguage === "en" ? "Name Surname" : "Nombre Apellido"}</span>}</h1>
                  <p className="cv-preview-job-title">{cvData.puesto || <span className="cv-placeholder">{cvLanguage === "en" ? "Desired role / Job title" : "Puesto deseado / Rol profesional"}</span>}</p>
                </div>
                {includePhoto && (cvData.foto ? <img src={cvData.foto} alt="Foto" className="cv-photo-preview" /> : <div className="cv-photo-placeholder cv-placeholder">{cvLanguage === "en" ? "Photo" : "Foto"}</div>)}
              </div>

              <section className="cv-preview-contact">
                <p>{contactoLinea1}</p>
                {socialLinks.length > 0 ? (
                  <div className="cv-contact-social">
                    {socialLinks.map((link, index) => {
                      const url = link.value.trim().startsWith("http") ? link.value.trim() : `https://${link.value.trim()}`;
                      let label = link.value.trim();
                      if (link.type === 'linkedin') label = 'LinkedIn';
                      if (link.type === 'github') label = 'GitHub';
                      if (link.type === 'web') label = 'Portfolio';
                      return (
                        <Fragment key={link.type}>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="cv-contact-link">
                            <span className="cv-contact-icon">
                              {link.type === 'linkedin' ? <FaLinkedin size="1em" /> : link.type === 'github' ? <FaGithub size="1em" /> : <FaGlobe size="1em" />}
                            </span>
                            <span className="cv-contact-text">{label}</span>
                            {/* Salto invisible para forzar la separación en pdf-parse */}
                            <span style={{ opacity: 0, position: "absolute", pointerEvents: "none", width: 0, overflow: "hidden" }}>{" \n "}</span>
                          </a>
                        </Fragment>
                      );
                    })}
                  </div>
                ) : contactoLinea2 ? <p>{contactoLinea2}</p> : null}
              </section>

              <hr className="cv-preview-divider" />

              {/* Secciones del CV */}
              {Object.entries(sectionsVisible).map(([key, visible]) => {
                if (!visible) return null;
                // Evitar que las flags individuales de links se rendericen como "secciones" con títulos al fondo.
                if (['linkedin', 'github', 'sitioWeb'].includes(key)) return null;

                // Renderizado Especial: Experiencias Estructuradas
                if (key === 'experiencias') {
                  const hasStructuredOld = cvData.experience && cvData.experience.length > 0;
                  const hasPlainOld = !!cvData.experiencias;

                  if (!hasStructuredOld && !hasPlainOld) {
                    return (
                      <section key={key} className="cv-preview-section">
                        <h4>{sectionLabels[key]}</h4>
                        <p className="cv-preview-paragraph-preline"><span className="cv-placeholder">{cvLanguage === "en" ? "Add details..." : "Agregá detalles..."}</span></p>
                      </section>
                    )
                  }

                  return (
                    <section key={key} className="cv-preview-section">
                      <h4>{sectionLabels[key]}</h4>
                      {cvData.experience && cvData.experience.length > 0 ? (
                        <div className="cv-preview-experience-list">
                          {cvData.experience.map((exp, idx) => (
                            <div key={exp.id || idx} className="cv-preview-exp-item" style={{ marginBottom: "1rem" }}>
                              <div className="cv-preview-exp-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <strong>{exp.position || <span className="cv-placeholder">Puesto</span>}</strong>
                                <span className="cv-preview-exp-date" style={{ fontSize: "0.9em", color: "var(--cv-text-secondary)" }}>
                                  {exp.startDate ? new Date(exp.startDate + "-01").toLocaleDateString(cvLanguage === 'en' ? 'en-US' : 'es-ES', { month: 'short', year: 'numeric' }) : ""}
                                  {exp.startDate && (exp.endDate || exp.current) ? " - " : ""}
                                  {exp.current ? (cvLanguage === "en" ? "Present" : "Actualidad") : (exp.endDate ? new Date(exp.endDate + "-01").toLocaleDateString(cvLanguage === 'en' ? 'en-US' : 'es-ES', { month: 'short', year: 'numeric' }) : "")}
                                </span>
                              </div>
                              <div className="cv-preview-exp-subheader" style={{ fontSize: "0.95em", fontStyle: "italic", marginBottom: "0.3rem" }}>
                                {[exp.company, exp.location].filter(Boolean).join(" · ")}
                              </div>
                              {exp.description && (
                                <p className="cv-preview-paragraph-preline" style={{ marginTop: "0.2rem" }}>{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="cv-preview-paragraph-preline">{cvData.experiencias}</p>
                      )}
                    </section>
                  );
                }

                if (key === 'habilidades' || key === 'idiomas') {
                  const arrKey = key === 'habilidades' ? 'skills' : 'languages';
                  const fallbackKey = key;
                  const dataArr = Array.isArray(cvData[arrKey]) ? cvData[arrKey] : [];
                  const hasData = dataArr.length > 0 || !!cvData[fallbackKey];

                  if (!hasData) {
                    return (
                      <section key={key} className="cv-preview-section">
                        <h4>{sectionLabels[key]}</h4>
                        <p className="cv-preview-paragraph"><span className="cv-placeholder">{cvLanguage === "en" ? "Add details..." : "Agregá detalles..."}</span></p>
                      </section>
                    );
                  }

                  return (
                    <section key={key} className="cv-preview-section">
                      <h4>{sectionLabels[key]}</h4>
                      {dataArr.length > 0 ? (
                        <div className="cv-preview-chip-container">
                          {dataArr.map((item, idx) => (
                            <span key={idx} className="cv-preview-chip">{item}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="cv-preview-paragraph">{cvData[fallbackKey]}</p>
                      )}
                    </section>
                  );
                }

                return (
                  <section key={key} className="cv-preview-section">
                    <h4>{sectionLabels[key]}</h4>
                    <p className={`cv-preview-paragraph${['educacion', 'proyectos', 'otros'].includes(key) ? '-preline' : ''}`}>
                      {cvData[key] || <span className="cv-placeholder">{cvLanguage === "en" ? "Add details..." : "Agregá detalles..."}</span>}
                    </p>
                  </section>
                )
              })}
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
                  <h3>JOBLU IA</h3>
                  <button type="button" className="cv-ai-close" onClick={closeAiPanel} aria-label="Cerrar panel de IA">✕</button>
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
                <button type="button" className="cv-ai-apply" onClick={applyAiSection} disabled={!aiSuggestion || aiLoading}>Aplicar sugerencia</button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* --- Modal Selector de Plantillas --- */}
      {showTemplateModal && (
        <div className="template-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="template-modal-header">
              <div>
                <h3>🎨 Elegí tu plantilla</h3>
                <p>Cambia el diseño visual sin perder tus datos.</p>
              </div>
              <button type="button" className="template-modal-close" onClick={() => setShowTemplateModal(false)}>✕</button>
            </div>
            <div className="template-modal-grid">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`template-card${templateId === tpl.id ? " active" : ""}${!tpl.isAcquired ? " locked" : ""}`}
                  disabled={!tpl.isAcquired}
                  onClick={() => { setTemplateId(tpl.id); setShowTemplateModal(false); }}
                >
                  {templateId === tpl.id && (
                    <span className="template-badge-active">Actual ✓</span>
                  )}
                  <span
                    className="template-card-dot"
                    style={{ background: tpl.color }}
                  />
                  <span className="template-card-thumbnail">{tpl.thumbnail}</span>
                  <span className="template-card-name">{tpl.name}</span>
                  <span className="template-card-category">{tpl.category}</span>
                  <span className="template-card-description">{tpl.description}</span>
                  <div className="template-card-features">
                    {tpl.features.map((f) => (
                      <span key={f} className="template-feature-tag">{f}</span>
                    ))}
                  </div>
                  {!tpl.isAcquired && (
                    <div className="template-card-lock">
                      <FaLock />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Confirmación Borrar (root level para overlay full-screen) --- */}
      {showClearModal && (
        <div className="job-apply-modal-overlay">
          <div className="job-apply-modal">
            <div className="job-apply-modal-icon" style={{ color: '#dc2626' }}><FaExclamationTriangle /></div>
            <h3 style={{ color: '#dc2626' }}>{cvLanguage === "en" ? "Clear CV" : "Borrar CV"}</h3>
            <p>{cvLanguage === "en" ? "This will delete all the text from your CV. This action cannot be undone." : "Esto va a borrar todo el texto de tu CV. Esta acción no se puede deshacer."}</p>
            <div className="job-apply-modal-actions">
              <button className="btn-secondary" onClick={() => setShowClearModal(false)}>{cvLanguage === "en" ? "Cancel" : "Cancelar"}</button>
              <button className="cv-clear-confirm-btn" onClick={() => { localStorage.removeItem(`joblu_cv_draft_${id || "new"}`); setCvData(emptyCv); setShowClearModal(false); }}>
                {cvLanguage === "en" ? "Yes, clear all" : "Sí, borrar todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}

export default CvBuilder;