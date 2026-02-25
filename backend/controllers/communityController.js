import Post from "../models/Post.js";

export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).lean();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los posts" });
    }
};

export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).lean();
        if (!post) return res.status(404).json({ error: "Post no encontrado" });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el post details" });
    }
};

export const createPost = async (req, res) => {
    try {
        const { title, content, authorName, authorEmail, category } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Título y contenido requeridos" });

        const newPost = new Post({
            title,
            content,
            category: category || "General",
            authorName: authorName || req.user.name,
            authorEmail: authorEmail || req.user.email,
            likedBy: [],
            comments: []
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        console.error("Error creando post:", err);
        res.status(500).json({ error: "Error al crear el post" });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: "El contenido no puede estar vacío" });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post no encontrado" });

        if (post.authorEmail !== req.user.email) {
            return res.status(403).json({ error: "No tienes permiso para editar este post" });
        }

        post.content = content.trim();
        post.isEdited = true;
        await post.save();

        res.json(post);
    } catch (err) {
        console.error("Error editando post:", err);
        res.status(500).json({ error: "Error al editar el post" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post no encontrado" });

        if (post.authorEmail !== req.user.email) {
            return res.status(403).json({ error: "No tienes permiso para eliminar este post" });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Post eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar el post" });
    }
};

export const addComment = async (req, res) => {
    try {
        const { content, authorName } = req.body;
        if (!content) return res.status(400).json({ error: "Contenido requerido" });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post no encontrado" });

        const newComment = {
            content,
            authorName: authorName || req.user.name,
            authorEmail: req.user.email,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        console.error("Error comentando:", err);
        res.status(500).json({ error: "Error al agregar comentario" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post no encontrado" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: "Comentario no encontrado" });

        if (comment.authorEmail !== req.user.email) {
            return res.status(403).json({ error: "No tenés permiso para borrar este comentario" });
        }

        post.comments.pull({ _id: req.params.commentId });
        await post.save();
        res.json(post);
    } catch (err) {
        console.error("Error eliminando comentario:", err);
        res.status(500).json({ error: "Error al eliminar el comentario" });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post no encontrado" });

        const { action } = req.body || {};
        const userIdStr = String(req.user.id);
        const index = post.likedBy.findIndex(id => String(id) === userIdStr);
        const alreadyLiked = index !== -1;

        if (action === "like") {
            if (!alreadyLiked) post.likedBy.push(req.user.id);
        } else if (action === "unlike") {
            if (alreadyLiked) post.likedBy.splice(index, 1);
        } else {
            if (alreadyLiked) post.likedBy.splice(index, 1);
            else post.likedBy.push(req.user.id);
        }

        await post.save();

        const newIndex = post.likedBy.findIndex(id => String(id) === userIdStr);

        res.json({
            postId: post._id,
            likes: post.likedBy.length,
            userHasLiked: newIndex !== -1,
            likedBy: post.likedBy
        });
    } catch (err) {
        console.error(`[Like API] Error en post ${req.params.id}:`, err);
        res.status(500).json({ error: "Error al actualizar like" });
    }
};
