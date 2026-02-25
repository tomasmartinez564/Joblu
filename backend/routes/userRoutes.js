import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { uploadAvatar } from "../middlewares/upload.js";
import { uploadAvatar as uploadAvatarController, updateProfile, getPublicProfile } from "../controllers/userController.js";

const router = Router();

// Endpoint as it was: /api/user/upload-avatar
router.post("/upload-avatar", authenticateToken, uploadAvatar.single("avatar"), uploadAvatarController);
// Endpoint as it was: /api/user/profile
router.put("/profile", authenticateToken, updateProfile);

// Note: /api/users/profile/:email was originally separated (users vs user).
// We'll export this router to handle both /api/user and /api/users, or we separate them in server.js

export default router;
