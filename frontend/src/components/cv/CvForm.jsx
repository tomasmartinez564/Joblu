import React from "react";

// ==========================================
// 📝 COMPONENTE: FORMULARIO DE CV (CvForm)
// ==========================================
function CvForm({
    cvData,
    onChange,
    settings = {},
    sectionsVisible,
    toggleSection,
    onPhotoChange,
    onRemovePhoto,
    onImprove,
    refs = {},
}) {
    const { cvLanguage = "es", includePhoto = true } = settings;

    return (
        <form className="cv-form">
            
            {/* --- 1. DATOS PERSONALES --- */}
            <h3 className="cv-form-sectionTitle">Datos personales</h3>

            <div className="cv-form-group-inline">
                <label>
                    {cvLanguage === "en" ? "Full name:" : "Nombre completo:"}
                    <input
                        type="text"
                        name="nombre"
                        value={cvData.nombre}
                        onChange={onChange}
                        placeholder={cvLanguage === "en" ? "e.g. Sofia Martinez" : "Ej: Sofía Martínez"}
                    />
                </label>

                <label>
                    {cvLanguage === "en" ? "Job title / role:" : "Puesto o título profesional:"}
                    <input
                        type="text"
                        name="puesto"
                        value={cvData.puesto}
                        onChange={onChange}
                        placeholder={cvLanguage === "en" ? "e.g. Frontend Developer" : "Ej: Desarrolladora Frontend"}
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
                        placeholder={cvLanguage === "en" ? "e.g. sofia.martinez@mail.com" : "Ej: sofi.martinez@mail.com"}
                    />
                </label>

                <label>
                    {cvLanguage === "en" ? "Phone:" : "Teléfono:"}
                    <input
                        type="text"
                        name="telefono"
                        value={cvData.telefono}
                        onChange={onChange}
                        placeholder={cvLanguage === "en" ? "e.g. +54 9 11 0000-0000" : "Ej: +54 9 11 0000-0000"}
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
                        placeholder={cvLanguage === "en" ? "e.g. Buenos Aires, Argentina" : "Ej: Buenos Aires, Argentina"}
                    />
                </label>

                <label>
                    {cvLanguage === "en" ? "Website / Portfolio:" : "Sitio web / Portfolio:"}
                    <input
                        type="text"
                        name="sitioWeb"
                        value={cvData.sitioWeb}
                        onChange={onChange}
                        placeholder={cvLanguage === "en" ? "e.g. myportfolio.com" : "Ej: miportfolio.com"}
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
                        placeholder={cvLanguage === "en" ? "e.g. linkedin.com/in/user" : "Ej: linkedin.com/in/usuario"}
                    />
                </label>

                <label>
                    GitHub:
                    <input
                        type="text"
                        name="github"
                        value={cvData.github}
                        onChange={onChange}
                        placeholder={cvLanguage === "en" ? "e.g. github.com/user" : "Ej: github.com/usuario"}
                    />
                </label>
            </div>

            {/* --- 2. GESTIÓN DE FOTO --- */}
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

            {/* --- 3. SECCIÓN: PERFIL PROFESIONAL --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Professional profile" : "Perfil profesional"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("perfil")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("perfil")}
                >
                    {sectionsVisible.perfil ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                {cvLanguage === "en" ? "Summary:" : "Resumen:"}
                <textarea
                    ref={refs.refTextareaPerfil}
                    name="perfil"
                    value={cvData.perfil}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "Write a short summary..." : "Escribe una breve descripción sobre vos..."}
                    rows="3"
                ></textarea>
            </label>

            {/* --- 4. SECCIÓN: EXPERIENCIA LABORAL --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Work experience" : "Experiencia laboral"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("experiencias")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("experiencias")}
                >
                    {sectionsVisible.experiencias ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                <textarea
                    name="experiencias"
                    value={cvData.experiencias}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "Company X · Frontend Developer..." : "Empresa X · Desarrollador Frontend..."}
                    rows="4"
                ></textarea>
            </label>

            {/* --- 5. SECCIÓN: EDUCACIÓN --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Education" : "Educación"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("educacion")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("educacion")}
                >
                    {sectionsVisible.educacion ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                <textarea
                    name="educacion"
                    value={cvData.educacion}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "University X · Web Development..." : "Universidad X · Tecnicatura..."}
                    rows="3"
                ></textarea>
            </label>

            {/* --- 6. SECCIÓN: HABILIDADES --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Skills" : "Habilidades"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("habilidades")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("habilidades")}
                >
                    {sectionsVisible.habilidades ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                {cvLanguage === "en" ? "Skills (comma or dash separated):" : "Habilidades (separadas por coma o guiones):"}
                <input
                    type="text"
                    name="habilidades"
                    value={cvData.habilidades}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "e.g.: HTML, CSS, React..." : "Ej: HTML, CSS, React..."}
                />
            </label>

            {/* --- 7. SECCIÓN: IDIOMAS --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Languages" : "Idiomas"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("idiomas")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("idiomas")}
                >
                    {sectionsVisible.idiomas ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                <input
                    type="text"
                    name="idiomas"
                    value={cvData.idiomas}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "e.g.: English B2..." : "Ej: Inglés B2..."}
                />
            </label>

            {/* --- 8. SECCIÓN: PROYECTOS --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Projects" : "Proyectos"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("proyectos")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("proyectos")}
                >
                    {sectionsVisible.proyectos ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                <textarea
                    name="proyectos"
                    value={cvData.proyectos}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "Personal portfolio..." : "Proyecto portafolio personal..."}
                    rows="3"
                ></textarea>
            </label>

            {/* --- 9. SECCIÓN: INFORMACIÓN ADICIONAL --- */}
            <div className="cv-form-sectionHeader">
                <h3 className="cv-form-sectionTitle">
                    {cvLanguage === "en" ? "Additional information" : "Información adicional"}
                    {onImprove && (
                        <button
                            type="button"
                            className="cv-improve-btn animated"
                            onClick={() => onImprove("otros")}
                            title={cvLanguage === "en" ? "Improve with AI" : "Mejorar con IA"}
                        >
                            ✨
                        </button>
                    )}
                </h3>
                <button
                    type="button"
                    className="cv-section-toggle"
                    onClick={() => toggleSection("otros")}
                >
                    {sectionsVisible.otros ? "− Ocultar del CV" : "+ Mostrar en el CV"}
                </button>
            </div>

            <label>
                {cvLanguage === "en" ? "Courses, certifications, etc.:" : "Cursos, certificaciones, etc.:"}
                <textarea
                    name="otros"
                    value={cvData.otros}
                    onChange={onChange}
                    placeholder={cvLanguage === "en" ? "e.g.: online courses..." : "Ej: Cursos online..."}
                    rows="3"
                ></textarea>
            </label>
        </form>
    );
}

export default CvForm;