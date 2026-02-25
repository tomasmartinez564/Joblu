import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    toggleLike
} from "../controllers/communityController.js";

const router = Router();

router.get("/posts", getPosts);
router.get("/posts/:id", getPostById);
router.post("/posts", authenticateToken, createPost);
router.put("/posts/:id", authenticateToken, updatePost);
router.delete("/posts/:id", authenticateToken, deletePost);

router.post("/posts/:id/comments", authenticateToken, addComment);
router.delete("/posts/:id/comments/:commentId", authenticateToken, deleteComment);

router.post("/posts/:id/like", authenticateToken, toggleLike);

export default router;
