import React from "react";
import { FaEye, FaEyeSlash, FaChevronLeft, FaChevronRight } from "react-icons/fa";

// ==========================================
// 📝 COMPONENTE: FORMULARIO DE CV (CvForm)
// ==========================================
function CvForm({
    cvData,
    onChange,
    settings = {},
    sectionsVisible = {},
    onToggleSection,
    onPhotoChange,
    onRemovePhoto,
    onImprove,
    refs = {},
    activeStep,
    steps,
    onNext,
    onPrev,
    onGoToStep
}) {
    const { cvLanguage = "es", includePhoto = true } = settings;

    // Helper para verificar si es el paso actual
    const isStep = (key) => steps[activeStep].key === key;

    const renderDatosPersonales = () => (
        <div className="cv-form-slide fade-in">
            <h3 className="cv-form-sectionTitle">Datos personales</h3>
            <div className="cv-form-group-inline">
                <label>
                    {cvLanguage === "en" ? "Full name:" : "Nombre completo:"}
                    <input type="text" name="nombre" value={cvData.nombre} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. Sofia Martinez" : "Ej: Sofía Martínez"} />
                </label>
                <label>
                    {cvLanguage === "en" ? "Job title / role:" : "Puesto o título profesional:"}
                    <input type="text" name="puesto" value={cvData.puesto} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. Frontend Developer" : "Ej: Desarrolladora Frontend"} />
                </label>
            </div>
            <div className="cv-form-group-inline">
                <label>
                    Email:
                    <input type="email" name="email" value={cvData.email} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. sofia.martinez@mail.com" : "Ej: sofi.martinez@mail.com"} />
                </label>
                <label>
                    {cvLanguage === "en" ? "Phone:" : "Teléfono:"}
                    <input type="text" name="telefono" value={cvData.telefono} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. +54 9 11 0000-0000" : "Ej: +54 9 11 0000-0000"} />
                </label>
            </div>
            <div className="cv-form-group-inline">
                <label>
                    {cvLanguage === "en" ? "Location:" : "Ubicación:"}
                    <input type="text" name="ubicacion" value={cvData.ubicacion} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. Buenos Aires, Argentina" : "Ej: Buenos Aires, Argentina"} />
                </label>
                <label>
                    {cvLanguage === "en" ? "Website / Portfolio:" : "Sitio web / Portfolio:"}
                    <input type="text" name="sitioWeb" value={cvData.sitioWeb} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. myportfolio.com" : "Ej: miportfolio.com"} />
                </label>
            </div>
            <div className="cv-form-group-inline">
                <label>
                    LinkedIn:
                    <input type="text" name="linkedin" value={cvData.linkedin} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. linkedin.com/in/user" : "Ej: linkedin.com/in/usuario"} />
                </label>
                <label>
                    GitHub:
                    <input type="text" name="github" value={cvData.github} onChange={onChange} placeholder={cvLanguage === "en" ? "e.g. github.com/user" : "Ej: github.com/usuario"} />
                </label>
            </div>
            {includePhoto && (
                <div className="cv-form-photo">
                    <label>
                        {cvLanguage === "en" ? "Profile picture:" : "Foto de perfil:"}
                        <input type="file" accept="image/*" onChange={onPhotoChange} />
                    </label>
                    {cvData.foto && (
                        <button type="button" className="cv-photo-remove-btn" onClick={onRemovePhoto}>
                            {cvLanguage === "en" ? "Remove photo" : "Quitar foto"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const renderSection = (key, title, placeholder, rows = 4, isInput = false) => (
        <div className="cv-form-slide fade-in">
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {title}
                    {onToggleSection && (
                        <button
                            type="button"
                            className={`cv-visibility-btn${sectionsVisible[key] === false ? ' cv-visibility-btn--hidden' : ''}`}
                            onClick={() => onToggleSection(key)}
                            title={sectionsVisible[key] === false
                                ? (cvLanguage === "en" ? "Show in preview" : "Mostrar en vista previa")
                                : (cvLanguage === "en" ? "Hide from preview" : "Ocultar de vista previa")
                            }
                        >
                            {sectionsVisible[key] === false ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    )}
                </h3>
            </div>
            <label>
                {isInput ? (
                    <input type="text" name={key} value={cvData[key]} onChange={onChange} placeholder={placeholder} />
                ) : (
                    <textarea
                        name={key}
                        value={cvData[key]}
                        onChange={onChange}
                        placeholder={placeholder}
                        rows={rows}
                        ref={key === 'perfil' ? refs.refTextareaPerfil : null}
                    ></textarea>
                )}
            </label>
        </div>
    );

    return (
        <div className="cv-form-container">
            <form className="cv-form">
                {isStep("datos") && renderDatosPersonales()}

                {isStep("perfil") && renderSection(
                    "perfil",
                    cvLanguage === "en" ? "Professional profile" : "Perfil profesional",
                    cvLanguage === "en" ? "Write a short summary..." : "Escribí una breve descripción sobre vos...",
                    6
                )}

                {isStep("experiencias") && renderSection(
                    "experiencias",
                    cvLanguage === "en" ? "Work experience" : "Experiencia laboral",
                    cvLanguage === "en" ? "Company X · Frontend Developer..." : "Empresa X · Desarrollador Frontend...",
                    8
                )}

                {isStep("educacion") && renderSection(
                    "educacion",
                    cvLanguage === "en" ? "Education" : "Educación",
                    cvLanguage === "en" ? "University X · Web Development..." : "Universidad X · Tecnicatura...",
                    6
                )}

                {isStep("habilidades") && renderSection(
                    "habilidades",
                    cvLanguage === "en" ? "Skills" : "Habilidades",
                    cvLanguage === "en" ? "e.g.: HTML, CSS, React..." : "Ej: HTML, CSS, React...",
                    1,
                    true
                )}

                {isStep("idiomas") && renderSection(
                    "idiomas",
                    cvLanguage === "en" ? "Languages" : "Idiomas",
                    cvLanguage === "en" ? "e.g.: English B2..." : "Ej: Inglés B2...",
                    1,
                    true
                )}

                {isStep("proyectos") && renderSection(
                    "proyectos",
                    cvLanguage === "en" ? "Projects" : "Proyectos",
                    cvLanguage === "en" ? "Personal portfolio..." : "Proyecto portafolio personal...",
                    6
                )}

                {isStep("otros") && renderSection(
                    "otros",
                    cvLanguage === "en" ? "Additional information" : "Información adicional",
                    cvLanguage === "en" ? "e.g.: online courses..." : "Ej: Cursos online...",
                    5
                )}
            </form>

            {/* --- Navegación entre Pasos --- */}
            <div className="cv-form-navigation">
                <button
                    type="button"
                    className="cv-nav-arrow"
                    onClick={onPrev}
                    disabled={activeStep === 0}
                    aria-label={cvLanguage === "en" ? "Previous" : "Anterior"}
                >
                    <FaChevronLeft />
                </button>

                {activeStep < steps.length - 1 ? (
                    <button type="button" className="cv-nav-arrow" onClick={onNext} aria-label={cvLanguage === "en" ? "Next" : "Siguiente"}>
                        <FaChevronRight />
                    </button>
                ) : (
                    <div className="cv-nav-spacer"></div>
                )}
            </div>
        </div>
    );
}

export default CvForm;