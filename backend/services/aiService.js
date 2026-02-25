import OpenAI from "openai";

let openaiInstance = null;

const getOpenAI = () => {
    if (!openaiInstance && process.env.OPENAI_API_KEY) {
        openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiInstance;
};

export const parseCvFromText = async (extractedText) => {
    const openai = getOpenAI();
    if (!openai) {
        throw new Error("OpenAI no está configurado");
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: `Eres un experto en reclutamiento. Extrae la información del CV y devuélvela ESTRICTAMENTE en este formato JSON: { "nombre": "Nombre", "puesto": "Rol", "email": "correo@ej.com", "telefono": "Tel", "ubicacion": "Ciudad", "sitioWeb": "URL", "linkedin": "URL", "github": "URL", "perfil": "Resumen", "experience": [ { "id": "Genera un ID único", "position": "Puesto", "company": "Empresa", "location": "Ubicación", "startDate": "YYYY-MM o vacío", "endDate": "YYYY-MM o vacío", "current": true o false, "description": "Tareas y logros" } ], "education": [ { "id": "Genera un ID único", "degree": "Título", "institution": "Institución", "location": "Ubicación", "startDate": "YYYY-MM o vacío", "endDate": "YYYY-MM o vacío", "current": true o false, "description": "Detalles" } ], "skills": ["Hab 1", "Hab 2"], "languages": ["Id 1", "Id 2"], "proyectos": "Texto", "otros": "Texto" } ATENCIÓN: Separa cada trabajo y estudio en sus propios arrays. Extrae habilidades e idiomas como arrays de strings. Si ves URLs pegadas, SEPÁRALAS lógicamente. REGLA DE FECHAS: Si solo hay UNA fecha, asúmelo como fecha de finalización, colócalo en "endDate" y deja "startDate" vacío. REGLA DE TEXTO: Si notas que las palabras dentro del CV original fueron extraídas sin espacios por error del PDF (ej. 'Armadodepedidos', 'AtencionalCliente'), DETECTA ESTO y SEPÁRALAS lógicamente ('Armado de pedidos', 'Atención al Cliente') en todo el JSON. Devuelve solo JSON.` },
            {
                role: "user",
                content: `Analiza este CV:\n\n${extractedText.substring(0, 15000)}`
            }
        ],
        response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
};

export const optimizeSection = async ({ section, content, language, tone, goal, jobDescription }) => {
    const openai = getOpenAI();
    if (!openai) {
        return `[Simulado] Versión mejorada (${tone}/${goal}) de: ${content}`;
    }

    const systemPrompt = `Eres un experto en RRHH. Mejora el texto para un CV.
  Idioma: ${language === 'en' ? 'Inglés' : 'Español'}.
  Tono: ${tone || 'Profesional'}.`;

    let userPrompt = `Texto original (${section}): "${content}".`;
    if (jobDescription) userPrompt += `\n\nContexto puesto: "${jobDescription}".`;

    if (goal === 'fix') userPrompt += "\nObjetivo: Corregir gramática.";
    else if (goal === 'make_shorter') userPrompt += "\nObjetivo: Resumir.";
    else if (goal === 'keywords') userPrompt += "\nObjetivo: Agregar palabras clave.";
    else userPrompt += "\nObjetivo: Mejorar impacto y profesionalismo.";

    userPrompt += "\n\nDevuelve ÚNICAMENTE el texto mejorado. No incluyas títulos, etiquetas, ni el nombre de la sección. No uses markdown (negritas, comillas) salvo que sea parte del contenido del CV.";

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    });

    return completion.choices[0].message.content.trim();
};
