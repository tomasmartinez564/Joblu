import mongoose from "mongoose";
import dotenv from "dotenv";


dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error("❌ MONGODB_URI no encontrada en .env");
    process.exit(1);
}

// Replicamos el esquema para que el script sea standalone o importamos...
// Para simpleza en un script quick-run, lo redefinimos aquí o usamos import si configuramos módulos.
// Dado que server.js usa 'import', asumimos "type": "module" en package.json (que parece ser el caso).
// Pero para evitar líos de imports circulares o path, lo defino aquí rápido.

const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        type: { type: String },
        description: { type: String },
        url: { type: String },
        salary: { type: String },
        externalId: { type: String },
        tags: [String],
        logo: { type: String },
        publishedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

async function seedJobs() {
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Conectado a MongoDB");

        // Borramos empleos anteriores para no duplicar masivamente en cada corrida de prueba
        console.log("🧹 Limpiando colección de empleos...");
        await Job.deleteMany({});

        console.log("🌐 Buscando empleos en Remotive API...");
        // Traemos más empleos para tener buena cantidad tras el filtrado
        const response = await fetch("https://remotive.com/api/remote-jobs");
        const data = await response.json();
        const allJobs = data.jobs || [];

        console.log(`📥 Total recuperado de API: ${allJobs.length} empleos.`);

        // Filtramos empleos disponibles para Argentina
        const keywords = ["argentina", "latam", "latin america", "south america", "americas", "worldwide", "anywhere"];

        const jobsFromApi = allJobs.filter(job => {
            const loc = (job.candidate_required_location || "").toLowerCase();
            return keywords.some(k => loc.includes(k));
        });

        console.log(`🇦🇷 Filtrados para Argentina: ${jobsFromApi.length} empleos.`);

        const jobDocs = jobsFromApi.map((apiJob) => ({
            title: apiJob.title,
            company: apiJob.company_name,
            location: apiJob.candidate_required_location,
            type: apiJob.job_type,
            description: apiJob.description,
            url: apiJob.url,
            salary: apiJob.salary || "",
            externalId: String(apiJob.id),
            tags: apiJob.tags || [],
            logo: apiJob.company_logo_url,
            publishedAt: new Date(apiJob.publication_date),
        }));

        if (jobDocs.length > 0) {
            await Job.insertMany(jobDocs);
            console.log(`✅ ¡Insertados ${jobDocs.length} empleos en la base de datos!`);
        } else {
            console.log("⚠️ No hubo empleos para insertar.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error en el seed:", err);
        process.exit(1);
    }
}

seedJobs();
