import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";

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
    onExperienceChange,
    onSkillsChange,
    onLanguagesChange,
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

    const renderWorkExperience = () => {
        const experiences = Array.isArray(cvData.experience) ? cvData.experience : [];
        const [openExperienceIndex, setOpenExperienceIndex] = useState(experiences.length > 0 ? 0 : null);

        const handleAdd = () => {
            const newExp = { id: Date.now().toString(), position: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" };
            onExperienceChange([...experiences, newExp]);
            setOpenExperienceIndex(experiences.length); // Abrir la nueva
        };

        const handleRemove = (e, id) => {
            e.stopPropagation();
            onExperienceChange(experiences.filter(exp => exp.id !== id));
        };

        const toggleAccordion = (index) => {
            setOpenExperienceIndex(prev => prev === index ? null : index);
        };

        const handleChangeExp = (id, field, value) => {
            onExperienceChange(experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
        };

        return (
            <div className="cv-form-slide fade-in">
                <div className="cv-form-sectionHeader">
                    <h3 className="cv-form-sectionTitle">
                        {cvLanguage === "en" ? "Work experience" : "Experiencia laboral"}
                        {onToggleSection && (
                            <button
                                type="button"
                                className={`cv-visibility-btn${sectionsVisible['experiencias'] === false ? ' cv-visibility-btn--hidden' : ''}`}
                                onClick={() => onToggleSection('experiencias')}
                            >
                                {sectionsVisible['experiencias'] === false ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        )}
                    </h3>
                </div>

                <div className="cv-experience-list">
                    {experiences.map((exp, index) => {
                        const isOpen = openExperienceIndex === index;
                        const headerTitle = exp.position || exp.company
                            ? [exp.position, exp.company].filter(Boolean).join(" en ")
                            : `${cvLanguage === "en" ? "Experience" : "Experiencia"} ${index + 1}`;

                        return (
                            <div key={exp.id || index} className={`cv-experience-card ${isOpen ? 'is-open' : 'is-closed'}`}>
                                <div
                                    className="cv-experience-card-header"
                                    onClick={() => toggleAccordion(index)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span className="cv-exp-accordion-icon">
                                            {isOpen ? <FaChevronUp size="0.8em" /> : <FaChevronDown size="0.8em" />}
                                        </span>
                                        <h4 style={{ margin: 0 }}>{headerTitle}</h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemove(e, exp.id)}
                                        className="cv-exp-remove-btn"
                                        title={cvLanguage === "en" ? "Remove" : "Eliminar"}
                                    >
                                        ✖
                                    </button>
                                </div>

                                {isOpen && (
                                    <div className="cv-experience-card-body">
                                        <div className="cv-form-group-inline">
                                            <label>
                                                {cvLanguage === "en" ? "Job title / role *" : "Puesto *"}
                                                <input type="text" value={exp.position} onChange={(e) => handleChangeExp(exp.id, "position", e.target.value)} placeholder={cvLanguage === "en" ? "e.g. Sales Manager" : "Ej: Vendedor"} required />
                                            </label>
                                            <label>
                                                {cvLanguage === "en" ? "Company *" : "Empresa *"}
                                                <input type="text" value={exp.company} onChange={(e) => handleChangeExp(exp.id, "company", e.target.value)} placeholder={cvLanguage === "en" ? "e.g. Tech Corp" : "Ej: Empresa X"} required />
                                            </label>
                                        </div>

                                        <div className="cv-form-group-inline">
                                            <label>
                                                {cvLanguage === "en" ? "Location" : "Ubicación"}
                                                <input type="text" value={exp.location} onChange={(e) => handleChangeExp(exp.id, "location", e.target.value)} placeholder={cvLanguage === "en" ? "e.g. New York, Remote..." : "Ej: Buenos Aires, Remoto..."} />
                                            </label>
                                            <div className="cv-form-dates-row">
                                                <label className="cv-form-date-input">
                                                    {cvLanguage === "en" ? "Start date *" : "Fecha inicio *"}
                                                    <input type="month" value={exp.startDate} onChange={(e) => handleChangeExp(exp.id, "startDate", e.target.value)} required />
                                                </label>
                                                <label className="cv-form-date-input" style={{ opacity: exp.current ? 0.5 : 1 }}>
                                                    {cvLanguage === "en" ? "End date" : "Fecha fin"}
                                                    <input type="month" value={exp.endDate} onChange={(e) => handleChangeExp(exp.id, "endDate", e.target.value)} disabled={exp.current} required={!exp.current} />
                                                </label>
                                            </div>
                                        </div>

                                        <label className="cv-exp-checkbox">
                                            <input type="checkbox" checked={exp.current} onChange={(e) => handleChangeExp(exp.id, "current", e.target.checked)} />
                                            {cvLanguage === "en" ? "I currently work here" : "Trabajo actualmente aquí"}
                                        </label>

                                        <label>
                                            {cvLanguage === "en" ? "Description / Achievements" : "Descripción / Tareas / Logros"}
                                            <textarea rows="3" value={exp.description} onChange={(e) => handleChangeExp(exp.id, "description", e.target.value)} placeholder={cvLanguage === "en" ? "Describe your responsibilities..." : "Describí tus responsabilidades y logros..."}></textarea>
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button type="button" onClick={handleAdd} className="cv-exp-add-btn">
                    + {cvLanguage === "en" ? "Add experience" : "Agregar experiencia"}
                </button>
            </div>
        );
    };

    const renderChipSection = (key, title, placeholder, items, onChangeItems) => {
        const [inputValue, setInputValue] = useState("");

        const handleAdd = () => {
            const val = inputValue.trim();
            if (!val) return;
            // Opcional: si el usuario pega comas, splitearlo de nuevo
            if (val.includes(",")) {
                const multi = val.split(",").map(s => s.trim()).filter(s => s && !items.includes(s));
                if (multi.length > 0) onChangeItems([...items, ...multi]);
            } else if (!items.includes(val)) {
                onChangeItems([...items, val]);
            }
            setInputValue("");
        };

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
            }
        };

        const handleRemove = (itemToRemove) => {
            onChangeItems(items.filter(i => i !== itemToRemove));
        };

        return (
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

                <div className="cv-chip-list">
                    {items.map((item, idx) => (
                        <div key={idx} className="cv-chip">
                            <span>{item}</span>
                            <button type="button" onClick={() => handleRemove(item)}>✖</button>
                        </div>
                    ))}
                </div>

                <div className="cv-chip-input-wrapper">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleAdd}
                        placeholder={placeholder}
                        className="cv-chip-input"
                    />
                    <span className="cv-chip-hint">{cvLanguage === "en" ? "Press Enter to add" : "Presioná Enter para agregar"}</span>
                </div>
            </div>
        );
    };

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

                {isStep("experiencias") && renderWorkExperience()}

                {isStep("educacion") && renderSection(
                    "educacion",
                    cvLanguage === "en" ? "Education" : "Educación",
                    cvLanguage === "en" ? "University X · Web Development..." : "Universidad X · Tecnicatura...",
                    6
                )}

                {isStep("habilidades") && renderChipSection(
                    "habilidades",
                    cvLanguage === "en" ? "Skills" : "Habilidades",
                    cvLanguage === "en" ? "e.g.: HTML, CSS, React..." : "Ej: HTML, CSS, React...",
                    Array.isArray(cvData.skills) ? cvData.skills : [],
                    onSkillsChange
                )}

                {isStep("idiomas") && renderChipSection(
                    "idiomas",
                    cvLanguage === "en" ? "Languages" : "Idiomas",
                    cvLanguage === "en" ? "e.g.: English B2..." : "Ej: Inglés B2...",
                    Array.isArray(cvData.languages) ? cvData.languages : [],
                    onLanguagesChange
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