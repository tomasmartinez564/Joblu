import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/postdetail.css";


const STORAGE_KEY = "joblu_liked_posts";

// Base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getInitialLikedPosts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [actionError, setActionError] = useState("");

  const [likedPosts, setLikedPosts] = useState(() => getInitialLikedPosts());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedPosts));
  }, [likedPosts]);

  const isLiked = post && likedPosts.includes(post._id);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/community/posts/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo obtener el post.");
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
        setError("Hubo un problema al cargar el post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const canDelete =
    user && post && post.authorEmail && user.email && user.email === post.authorEmail;

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que querés eliminar este post?")) return;

      setActionError("");

    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/community/posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo borrar el post.");
      navigate("/comunidad");
      } catch (err) {
        console.error(err);
        setActionError("Hubo un problema al borrar el post.");
      } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError("");

    if (!commentContent.trim()) {
      setCommentError("Escribí un comentario antes de publicar.");
      return;
    }

    const authorName = user?.name || "Usuario anónimo";
    const authorEmail = user?.email || "";

    try {
      setCommentLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/community/posts/${id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorName,
            authorEmail,
            content: commentContent,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo agregar el comentario.");
      }

      const newComment = await res.json();

      setPost((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments || []), newComment] }
          : prev
      );

      setCommentContent("");
    } catch (err) {
      console.error(err);
      setCommentError(err.message || "Hubo un problema al comentar.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!post) return;

      setActionError("");

    const alreadyLiked = likedPosts.includes(post._id);
    const action = alreadyLiked ? "unlike" : "like";

    try {
        const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/community/posts/${post._id}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      if (!res.ok) {
        throw new Error("No se pudo actualizar el like.");
      }

      const updatedPost = await res.json();

      setPost((prev) =>
        prev ? { ...prev, likes: updatedPost.likes } : prev
      );

      setLikedPosts((prev) =>
        alreadyLiked
          ? prev.filter((id) => id !== post._id)
          : [...prev, post._id]
      );
      } catch (err) {
        console.error(err);
        setActionError("Hubo un problema al actualizar el like.");
      }

  };

  // Estados de carga y error
  if (loading) {
    return (
      <section className="community postdetail">
        <p className="postdetail-status">Cargando post...</p>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="community postdetail">
        <p className="postdetail-status">
          {error || "Post no encontrado."}
        </p>
        <Link to="/comunidad" className="postdetail-back-link">
          ← Volver a la comunidad
        </Link>
      </section>
    );
  }

  return (
    <section className="community postdetail">
      {/* Botón claro para volver */}
      <div className="postdetail-back">
        <Link to="/comunidad" className="postdetail-back-link">
          ← Volver a la comunidad
        </Link>
      </div>

      {/* Título y meta */}
      <h2 className="postdetail-title">{post.title}</h2>

      <p className="postdetail-meta">
        por {post.authorName || "Usuario"} · {formatDate(post.createdAt)}
      </p>

      {/* Likes */}
      <div className="postdetail-like-row">
        <button
          type="button"
          onClick={handleToggleLike}
          className="postdetail-like-button"
        >
          {isLiked ? "💙 Quitar like" : "🤍 Me gusta"}
        </button>

        <span className="postdetail-like-count">
          {(post.likes ?? 0)} like{(post.likes ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {actionError && (
        <p className="postdetail-action-error">{actionError}</p>
      )}

      {/* Contenido principal del post */}
      <div className="postdetail-content">
        {post.content}
      </div>

      {/* Botón de borrar (solo autor) */}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="postdetail-delete-btn"
        >
          {deleting ? "Eliminando..." : "Eliminar post"}
        </button>
      )}

      {/* Sección de comentarios */}
      <section className="postdetail-comments">
        <h3 className="postdetail-comments-title">Comentarios</h3>

        {/* Lista de comentarios */}
        {(!post.comments || post.comments.length === 0) ? (
          <p className="postdetail-comments-empty">
            Todavía no hay comentarios. ¡Sé la primera persona en comentar!
          </p>
        ) : (
          <ul className="postdetail-comments-list">
            {post.comments.map((c, index) => (
              <li key={index} className="postdetail-comment">
                <p className="postdetail-comment-header">
                  <span className="postdetail-comment-author">
                    {c.authorName || "Usuario anónimo"}
                  </span>
                  <span className="postdetail-comment-meta">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : ""}
                  </span>
                </p>
                <p className="postdetail-comment-body">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Formulario para agregar comentario */}
        <form
          onSubmit={handleAddComment}
          className="community-form community-form--compact"
        >
          {commentError && (
            <p className="community-error-text">
              {commentError}
            </p>
          )}

          <textarea
            placeholder="Escribí tu comentario..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={3}
            className="community-textarea community-input"
          />

          <button
            type="submit"
            disabled={commentLoading}
            className="btn-joblu"
          >
            {commentLoading ? "Publicando..." : "Publicar comentario"}
          </button>
        </form>
      </section>
    </section>
  );
}

export default PostDetail;
