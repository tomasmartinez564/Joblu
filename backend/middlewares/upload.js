import multer from "multer";
import path from "path";

// Configuración Multer para Importación de CVs
const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `cv-import-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

export const uploadCv = multer({
    storage: cvStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["application/pdf", "text/plain"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten archivos PDF o de texto (.txt)."));
        }
    }
});

// Configuración Multer para Avatar
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

export const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP)."));
        }
    }
});
