import React from "react";

function CvForm({
    cvData,
    onChange,
    settings = {},
    sectionsVisible,
    toggleSection,
    onPhotoChange,
    onRemovePhoto,
    refs = {},
}) {
    const { cvLanguage = "es", includePhoto = true } = settings;

    return (
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
                        onChange={onChange}
                        placeholder={
                            cvLanguage === "en" ? "e.g. Sofia Martinez" : "Ej: Sofía Martínez"
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
                        onChange={onChange}
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
                        onChange={onChange}
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
                        onChange={onChange}
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
                        onChange={onChange}
                        placeholder={
                            cvLanguage === "en"
                                ? "e.g. Buenos Aires, Argentina"
                                : "Ej: Buenos Aires, Argentina"
                        }
                    />
                </label>

                <label>
                    {cvLanguage === "en"
                        ? "Website / Portfolio:"
                        : "Sitio web / Portfolio:"}
                    <input
                        type="text"
                        name="sitioWeb"
                        value={cvData.sitioWeb}
                        onChange={onChange}
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
                        onChange={onChange}
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
                        onChange={onChange}
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
                        <input type="file" accept="image/*" onChange={onPhotoChange} />
                    </label>

                    {cvData.foto && (
                        <button
                            type="button"
                            className="cv-photo-remove-btn"
                            onClick={onRemovePhoto}
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
                    ref={refs.refTextareaPerfil}
                    name="perfil"
                    value={cvData.perfil}
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    onChange={onChange}
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
                    {cvLanguage === "en"
                        ? "Additional information"
                        : "Información adicional"}
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
                    onChange={onChange}
                    placeholder={
                        cvLanguage === "en"
                            ? "e.g.: online courses, certifications, volunteering, relevant interests..."
                            : "Ej: Cursos online, certificaciones, voluntariados, intereses relevantes..."
                    }
                    rows="3"
                ></textarea>
            </label>
        </form>
    );
}

export default CvForm;
