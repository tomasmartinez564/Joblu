import Job from "../models/Job.js";

export const getJobs = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } }
            ];
        }
        const jobs = await Job.find(query).sort({ publishedAt: -1 }).limit(50);
        res.json(jobs);
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({ error: "Error al obtener empleos", details: err.message });
    }
};

export const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ error: "Empleo no encontrado" });
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el empleo" });
    }
};
