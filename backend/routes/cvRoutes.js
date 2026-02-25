import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { uploadCv } from "../middlewares/upload.js";
import { aiLimiter } from "../middlewares/rateLimit.js";
import {
    getCvs,
    getCvById,
    createCv,
    updateCv,
    deleteCv,
    importCv,
    optimizeCvSection,
    generateCvPdf
} from "../controllers/cvController.js";

const router = Router();

// CRUD CVs
router.get("/", authenticateToken, getCvs);
router.get("/:id", authenticateToken, getCvById);
router.post("/", authenticateToken, createCv);
router.put("/:id", authenticateToken, updateCv);
router.delete("/:id", authenticateToken, deleteCv);

// Funcionalidades Especiales
router.post("/import", authenticateToken, uploadCv.single("file"), importCv);
router.post("/generate-pdf", authenticateToken, generateCvPdf);

export default router;
