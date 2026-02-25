import fileSystem from "fs";
import { createRequire } from "module";
import Cv from "../models/Cv.js";
import { parseCvFromText, optimizeSection } from "../services/aiService.js";
import { generatePdf } from "../services/pdfService.js";

const fs = fileSystem;
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const getCvs = async (req, res) => {
    try {
        const cvs = await Cv.find({ userId: req.user.id }).sort({ updatedAt: -1 });
        res.json(cvs);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener CVs" });
    }
};

export const getCvById = async (req, res) => {
    try {
        const cv = await Cv.findOne({ _id: req.params.id, userId: req.user.id });
        if (!cv) return res.status(404).json({ error: "CV no encontrado" });
        res.json(cv);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el CV" });
    }
};

export const createCv = async (req, res) => {
    try {
        const newCv = new Cv({ userId: req.user.id, ...req.body });
        await newCv.save();
        res.status(201).json(newCv);
    } catch (err) {
        res.status(500).json({ error: "Error al crear CV" });
    }
};

export const updateCv = async (req, res) => {
    try {
        const updatedCv = await Cv.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!updatedCv) return res.status(404).json({ error: "CV no encontrado" });
        res.json(updatedCv);
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar CV" });
    }
};

export const deleteCv = async (req, res) => {
    try {
        const deletedCv = await Cv.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!deletedCv) return res.status(404).json({ error: "CV no encontrado" });
        res.json({ message: "CV eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar CV" });
    }
};

export const importCv = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No hay archivo para importar." });

        let extractedText = "";

        if (req.file.mimetype === "application/pdf") {
            const dataBuffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
        } else if (req.file.mimetype === "text/plain") {
            extractedText = fs.readFileSync(req.file.path, "utf8");
        }

        let parsedData = { nombre: "", puesto: "", email: "", telefono: "", ubicacion: "", sitioWeb: "", linkedin: "", github: "", perfil: "", experience: [], educacion: "", education: [], skills: [], languages: [], proyectos: "", otros: "" };

        try {
            parsedData = await parseCvFromText(extractedText);
        } catch (aiError) {
            console.error("⚠️ Error parseando CV con IA (usando fallback):", aiError);
        }

        const newCv = new Cv({
            userId: req.user.id,
            title: req.file.originalname,
            puesto: parsedData.puesto || "",
            data: parsedData
        });

        await newCv.save();
        try { fs.unlinkSync(req.file.path); } catch (e) { }

        res.status(201).json(newCv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al importar el CV." });
    }
};

export const optimizeCvSection = async (req, res) => {
    const { section, content, language, tone, goal, jobDescription } = req.body;
    try {
        const suggestion = await optimizeSection({ section, content, language, tone, goal, jobDescription });
        res.json({ suggestion });
    } catch (err) {
        console.error("Error AI Validation:", err);
        res.status(500).json({ error: "Error al procesar con IA." });
    }
};

export const generateCvPdf = async (req, res) => {
    const { htmlContent, styleTags } = req.body;

    if (!htmlContent) {
        return res.status(400).json({ error: "htmlContent es requerido" });
    }

    try {
        const pdfBuffer = await generatePdf(htmlContent, styleTags);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Length": pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({
            error: "Error al generar el PDF",
            details: error.message
        });
    }
}
